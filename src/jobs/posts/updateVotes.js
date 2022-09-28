const moment = require('moment');
const _ = require('lodash');
const { expireClient } = require('../../redis');
const { postModel } = require('../../database/models');
const { hiveOperations } = require('../../utilities/hiveApi');
const { REDIS_KEY } = require('../../constants/redis');

const VOTE_FIELDS = ['voter', 'percent', 'rshares', 'rsharesWAIV'];

const run = async () => {
  const hourAgo = moment.utc().subtract(1, 'hour').startOf('hour').format();
  const { result: posts } = await expireClient.smembers({
    key: `${REDIS_KEY.VOTE_UPDATES}:${hourAgo}`,
  });
  if (_.isEmpty(posts)) return;

  for (const post of posts) {
    const [author, permlink] = post.split('/');
    const { result: postInDb } = await postModel.find({
      filter: { root_author: author, permlink },
    });
    if (!postInDb) continue;
    const postForUpdate = await hiveOperations.getPostInfo({ author, permlink });
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
    const { result: res } = await postModel.updateOne({
      filter: {
        root_author: postForUpdate.root_author,
        permlink: postForUpdate.permlink,
      },
      update: {
        $set: postForUpdate,
      },
    });
    if (res.modifiedCount) this.logger.log(`Votes on @${author}/${permlink} updated!`);
  }
  await expireClient.del(`${REDIS_KEY.VOTE_UPDATES}:${hourAgo}`);
};

module.exports = {
  run,
};
