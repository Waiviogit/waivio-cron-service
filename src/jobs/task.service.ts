import { REDIS_EXPIRE_CLIENT, REDIS_KEY_VOTE_UPDATES } from '../common/constants';
import { HiveMindService } from '../common/hiveApi/hive-mind.service';
import { PostsService } from '../post/post.service';
import { Injectable } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import { Cron } from '@nestjs/schedule';
import * as moment from 'moment'
import * as _ from 'lodash'

@Injectable()
export class TasksService {
  private expirePostClient;

  constructor(
    private readonly postService: PostsService,
    private readonly redisService: RedisService,
    private readonly hiveMindService: HiveMindService,
  ) {
    this.expirePostClient = this.redisService.getClient(REDIS_EXPIRE_CLIENT)
  }

  @Cron('05 */1 * * *')
  async updateVotesOnPost(): Promise<void> {
    const hourAgo = moment.utc().subtract(1, 'hour').startOf('hour').format()
    const posts = await this.expirePostClient.smembers(`${REDIS_KEY_VOTE_UPDATES}:${hourAgo}`)
    if(_.isEmpty(posts)) return
    for (const post of posts) {
      const [author, permlink] = post.split('/')
      const postInDb = await this.postService.findOneByRootAuthorPermlink(author, permlink)
      if (!postInDb) continue;
      const postForUpdate = await this.hiveMindService.getPost(author, permlink)
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
     await this.postService.updateOne(postForUpdate)
    }
    await this.expirePostClient.del(`${REDIS_KEY_VOTE_UPDATES}:${hourAgo}`)
  }
}
