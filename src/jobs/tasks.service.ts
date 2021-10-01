import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import { Cron } from '@nestjs/schedule';
import * as moment from 'moment';
import * as _ from 'lodash';
import { PostsService } from '../post/post.service';
import { REDIS_EXPIRE_CLIENT, REDIS_KEY_CHILDREN_UPDATE, REDIS_KEY_VOTE_UPDATES } from '../common/constants';
import { HiveMindService } from '../hiveApi/hive-mind.service';

@Injectable()
export class TasksService {
  private expirePostClient;
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly postService: PostsService,
    private readonly redisService: RedisService,
    private readonly hiveMindService: HiveMindService,
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
      postForUpdate.active_votes = _.map(postForUpdate.active_votes, (vote) => ({
        voter: vote.voter,
        weight: Math.round(vote.rshares * 1e-6),
        percent: vote.percent,
        rshares: vote.rshares,
      }));
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
}
