const moment = require('moment');
const _ = require('lodash');
const { expireClient, lastBlockClient } = require('../../redis');
const { postModel } = require('../../database/models');
const { hiveOperations } = require('../../utilities/hiveApi');
const commentContract = require('../../utilities/hiveEngine/commentContract');
const { REDIS_KEY } = require('../../constants/redis');
const { TOKEN_WAIV } = require('../../constants/hiveEngine');
const { parseJson } = require('../../helpers/jsonHelper');

const VOTE_FIELDS = ['voter', 'percent', 'rshares', 'rsharesWAIV'];

const postWithWaiv = (metadata) => {
  const parsed = parseJson(metadata);
  const metadataTags = parsed?.tags ?? [];
  return TOKEN_WAIV.TAGS.some((el) => metadataTags.includes(el));
};

const addWaivToPost = async (post, rewards) => {
  const { author, permlink } = post;

  const [engineVotes, enginePost] = await Promise.all([
    commentContract.getVotes({
      query: {
        authorperm: `@${author}/${permlink}`,
        symbol: 'WAIV',
      },
    }),
    commentContract.getPost({
      query: {
        authorperm: `@${author}/${permlink}`,
        symbol: 'WAIV',
      },
    }),
  ]);

  if (!_.isEmpty(engineVotes)) {
    for (const vote of post.active_votes) {
      const waivVote = _.find(engineVotes, (v) => v.voter === vote.voter);
      if (!waivVote) continue;
      vote.rsharesWAIV = +waivVote.rshares;
    }
    console.log(`Waiv on @${author}/${permlink} updated!`);
  }
  if (!_.isEmpty(enginePost)) {
    post.net_rshares_WAIV = +enginePost.voteRshareSum;
    post.total_payout_WAIV = +enginePost.voteRshareSum * rewards;
  }
};

const run = async () => {
  console.log('update on votes started');
  const hourAgo = moment.utc().subtract(1, 'hour').startOf('hour').format();
  const { result: posts } = await expireClient.smembers({
    key: `${REDIS_KEY.VOTE_UPDATES}:${hourAgo}`,
  });
  if (_.isEmpty(posts)) return;

  const { result: smtPool } = await lastBlockClient.hgetall({ key: `${REDIS_KEY.SMT_POOL}:${TOKEN_WAIV.SYMBOL}` });
  const { rewardPool, pendingClaims } = smtPool;
  const rewards = parseFloat(rewardPool) / parseFloat(pendingClaims);

  for (const post of posts) {
    const [author, permlink] = post.split('/');
    const { result: postInDb } = await postModel.findOne({
      filter: { root_author: author, permlink },
    });
    if (!postInDb) continue;
    const postForUpdate = await hiveOperations.getPostInfo({ author, permlink });
    if (!postForUpdate) continue;

    postForUpdate.author = postInDb.author;
    postForUpdate.active_votes = _.reduce(
      postForUpdate.active_votes,
      (acc, item) => {
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
      [],
    );
    _.forEach(postInDb.active_votes, (dbVote) => {
      if (dbVote.voter.includes('_')) {
        postForUpdate.active_votes.push(dbVote);
      }
    });

    if (postWithWaiv(postForUpdate?.json_metadata)) {
      await addWaivToPost(postForUpdate, rewards);
    }

    const { result: res, error: updateError } = await postModel.updateOne({
      filter: {
        root_author: postForUpdate.root_author,
        permlink: postForUpdate.permlink,
      },
      update: {
        $set: postForUpdate,
      },
    });
    if (updateError) console.log(updateError.message);
    if (res?.modifiedCount) console.log(`Votes on @${author}/${permlink} updated!`);
  }
  await expireClient.del({ key: `${REDIS_KEY.VOTE_UPDATES}:${hourAgo}` });
};

module.exports = {
  run,
};
