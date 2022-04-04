import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as moment from 'moment';
import * as _ from 'lodash';
import * as util from 'util';
import checkDiskSpace from 'check-disk-space';
import { PostsService } from '../post/post.service';
import {
  REDIS_KEY_DISTRIBUTE_HIVE_ENGINE_REWARD,
  REDIS_KEY_CHILDREN_UPDATE,
  REDIS_KEY_VOTE_UPDATES,
  REDIS_EXPIRE_CLIENT,
  VOTE_FIELDS,
  TOKEN_WAIV,
} from '../common/constants';
import { HiveMindService } from '../hiveApi/hive-mind.service';
import { UserService } from '../user/user.service';
import { HiveEngineService } from '../hiveApi/hive-engine.service';
import { getGeckoPrice } from '../common/helpers/coingeckoHelper';
import { bytesConverterConstants } from '../common/constants/bytes-converter.constants';
import { sendMessageToNotifierService } from '../common/helpers/messageToNotifierServiceHelper';

const sleep = util.promisify(setTimeout);

@Injectable()
export class TasksService {
  private expirePostClient;
  private readonly logger = new Logger(TasksService.name);
  private getPrice = getGeckoPrice;

  constructor(
    private readonly postService: PostsService,
    private readonly redisService: RedisService,
    private readonly hiveMindService: HiveMindService,
    private readonly hiveEngineService: HiveEngineService,
    private readonly userService: UserService,
  ) {
    this.expirePostClient = this.redisService.getClient(REDIS_EXPIRE_CLIENT);
  }

  @Cron('05 */1 * * *')
  async updateVotesOnPost(): Promise<void> {
    const hourAgo = moment.utc().subtract(1, 'hour').startOf('hour').format();
    const posts = await this.expirePostClient.smembers(`${REDIS_KEY_VOTE_UPDATES}:${hourAgo}`);
    if (_.isEmpty(posts)) return;

    for (const post of posts) {
      const [author, permlink] = post.split('/');
      const postInDb = await this.postService.findOneByRootAuthorPermlink(author, permlink);
      if (!postInDb) continue;
      const postForUpdate = await this.hiveMindService.getPost(author, permlink);
      if (!postForUpdate) continue;

      postForUpdate.author = postInDb.author;
      postForUpdate.active_votes = _.reduce(postForUpdate.active_votes, (acc, item) => {
        acc.push({
          ..._
            .chain(item)
            .merge(_.pick(
              _.find(postInDb.active_votes, { voter: item.voter }),
              ['rsharesWAIV'],
            ))
            .pick(VOTE_FIELDS)
            .value(),
          weight: Math.round(item.rshares * 1e-6),
        });
        return acc;
      },
      []);
      _.forEach(postInDb.active_votes, (dbVote) => {
        if (dbVote.voter.includes('_')) {
          postForUpdate.active_votes.push(dbVote);
        }
      });
      const res = await this.postService.updateOneByRoot(postForUpdate);
      if (res.modifiedCount) this.logger.log(`Votes on @${author}/${permlink} updated!`);
    }
    await this.expirePostClient.del(`${REDIS_KEY_VOTE_UPDATES}:${hourAgo}`);
  }

  @Cron('20 */1 * * *')
  async updateChildrenOnPost(): Promise<void> {
    const hourAgo = moment.utc().subtract(1, 'hour').startOf('hour').format();
    const records = await this.expirePostClient.smembers(`${REDIS_KEY_CHILDREN_UPDATE}:${hourAgo}`);
    if (_.isEmpty(records)) return;

    for (const record of records) {
      const [author, permlink] = record.split('/');
      const comment = await this.hiveMindService.getPost(author, permlink);
      if (!comment || !comment.root_author) continue;
      const post = await this.hiveMindService.getPost(comment.root_author, comment.root_permlink);
      if (!post || !post.author) continue;
      const res = await this.postService
        .updateOneByRoot(_.pick(post, ['root_author', 'permlink', 'children']));
      if (res.modifiedCount) this.logger.log(`Children on @${post.root_author}/${post.permlink} updated!`);
    }
    await this.expirePostClient.del(`${REDIS_KEY_CHILDREN_UPDATE}:${hourAgo}`);
  }

  @Cron('30 11 */1 * *')
  async voteOnHiveEnginePosts(): Promise<void> {
    if (process.env.NODE_ENV !== 'production') return;
    const threeDaysAgo = moment.utc().subtract(3, 'days').startOf('day').format();
    const postsKey = `${REDIS_KEY_DISTRIBUTE_HIVE_ENGINE_REWARD}:${TOKEN_WAIV.SYMBOL}:${threeDaysAgo}`;
    const welcomeKey = `${TOKEN_WAIV.WELCOME_REDIS}:${moment.utc().startOf('day').format()}`;

    const records = await this.expirePostClient.smembers(postsKey);
    const voted = await this.expirePostClient
      .zrevrange(`${TOKEN_WAIV.CURATOR_VOTED}:${TOKEN_WAIV.SYMBOL}`, 0, -1);

    if (_.isEmpty(records)) return;

    const postsList = _.map(records, (el) => ({ author: el.split('/')[0], permlink: el.split('/')[1] }));

    const dieselPool = await this.hiveEngineService.getDieselPool(TOKEN_WAIV.DIESEL_POOL_ID);
    const smtPool = await this.hiveEngineService.getRewardPool(TOKEN_WAIV.POOL_ID);
    const { quotePrice } = dieselPool;
    const { rewardPool, pendingClaims } = smtPool;

    const { usd, error } = await this.getPrice('HIVE', 'USD', (d) => _.get(d, 'data.hive'));
    if (error) {
      this.logger.error(error.message);
      return;
    }

    const price = parseFloat(quotePrice) * usd;
    const rewards = parseFloat(rewardPool) / parseFloat(pendingClaims);
    const rsharesFilter = TOKEN_WAIV.WELCOME_USD_FILTER / (price * rewards);

    const users = await this.userService.find(
      {
        name: { $in: _.uniq(_.map(postsList, 'author')) },
        [TOKEN_WAIV.EXPERTISE_FIELD]: { $lt: rsharesFilter },
      },
      { [TOKEN_WAIV.EXPERTISE_FIELD]: 1, name: 1 },
    );
    if (!users.length) {
      return this.logger.error('problems with user request');
    }
    this.logger.log(`users filter: ${users.length}`);

    const filteredPosts = _
      .chain(postsList)
      .filter((el) => _.includes(_.map(users, 'name'), el.author))
      .filter((el) => !_
        .some(
          _.map(voted, (vote) => ({ author: vote.split('/')[0], permlink: vote.split('/')[1] })),
          (v) => v.author === el.author && v.permlink === el.permlink,
        ))
      .uniqBy('author')
      .value();
    if (_.isEmpty(filteredPosts)) return;

    let spentWeight = 0;
    const estimatedWeightOnPost = TOKEN_WAIV.WELCOME_DAILY_WEIGHT / filteredPosts.length;
    const realWeight = estimatedWeightOnPost > 10000
      ? 10000
      : Math.ceil(estimatedWeightOnPost);

    const sleepTime = Math.floor(TOKEN_WAIV.WELCOME_DAILY_VOTE_TIME / filteredPosts.length);

    for (const post of filteredPosts) {
      const vote = {
        voter: process.env.WELCOME_BOT_NAME,
        author: post.author,
        permlink: post.permlink,
        weight: realWeight,
        key: process.env.WELCOME_BOT_KEY,
      };
      const { error: voteError } = await this.hiveMindService.vote(vote);
      if (voteError) {
        this.logger.log(voteError.message);
        continue;
      }

      await this.expirePostClient.sadd(welcomeKey, `${vote.author}/${vote.permlink}/${vote.weight}`);
      await this.expirePostClient.expire(welcomeKey, 345600);
      this.logger.log(`success vote on ${vote.author}/${vote.permlink} weight: ${vote.weight}`);
      await sleep(sleepTime);
      spentWeight += realWeight;
      if (spentWeight >= TOKEN_WAIV.WELCOME_DAILY_WEIGHT) return;
    }
  }

  @Cron(CronExpression.EVERY_2_HOURS)
  async calculateFreeDiskSpace(): Promise<void> {
    if (!['staging', 'production'].includes(process.env.NODE_ENV)) return;

    const space = await checkDiskSpace('/');
    const freeGb = (space.free / bytesConverterConstants.BYTES_IN_GIGABYTE)
      .toFixed(bytesConverterConstants.PRECISION);

    if (+freeGb < 22) await sendMessageToNotifierService(`There is ${freeGb} of free space on the disk left on ${process.env.NODE_ENV}`);
  }
}
