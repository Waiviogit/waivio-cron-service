const moment = require('moment');
const _ = require('lodash');
const { setTimeout } = require('node:timers/promises');
const { redis8 } = require('../../redis');
const { userModel } = require('../../database/models');
const { hiveOperations } = require('../../utilities/hiveApi');
const marketPools = require('../../utilities/hiveEngine/marketPools');
const commentContract = require('../../utilities/hiveEngine/commentContract');
const { REDIS_KEY } = require('../../constants/redis');
const { getGeckoPrice } = require('../../helpers/congeckoHelper');
const { TOKEN_WAIV } = require('../../constants/hiveEngine');
const { parseJson } = require('../../helpers/jsonHelper');

const WELCOME_Q_NAME = 'posting_q_waivio_welcome';
const LOCK_KEY = 'posting_q_waivio_welcome_lock';

const createMockPost = async ({ author, permlink }) => {
  const threeDaysAgo = moment.utc().subtract(3, 'days').startOf('day').format();
  const postsKey = `${REDIS_KEY.DISTRIBUTE_HIVE_ENGINE_REWARD}:${TOKEN_WAIV.SYMBOL}:${threeDaysAgo}`;

  await redis8.sadd({ key: postsKey, member: `${author}/${permlink}` });

  const { result } = await userModel.findOne({ filter: { name: author } });

  if (!result) {
    await userModel.insertOne(
      { doc: { name: author, [TOKEN_WAIV.EXPERTISE_FIELD]: 0 } },
    );
  }
};

const acquireLock = async () => {
  const { result } = await redis8.set({
    key: LOCK_KEY,
    data: 'locked',
    mode: 'NX',
  });
  return result === 'OK';
};

const releaseLock = async () => {
  await redis8.del({ key: LOCK_KEY });
};

const processFilteredPosts = async () => {
  const lockAcquired = await acquireLock();
  if (!lockAcquired) {
    console.log('Another instance is already processing filtered posts.');
    return;
  }

  let spentWeight = 0;

  console.log('Starting WELCOME voting...');

  while (spentWeight < TOKEN_WAIV.WELCOME_DAILY_WEIGHT) {
    const { result: totalPostsCount } = await redis8.llen({ key: WELCOME_Q_NAME });
    if (totalPostsCount === 0) {
      console.log('No more posts to process.');
      break;
    }

    const estimatedWeightOnPost = (TOKEN_WAIV.WELCOME_DAILY_WEIGHT - spentWeight) / totalPostsCount;
    const realWeight = estimatedWeightOnPost > 10000 ? 10000 : Math.ceil(estimatedWeightOnPost);
    const sleepTimeMs = Math.floor((TOKEN_WAIV.WELCOME_DAILY_VOTE_TIME - (spentWeight / TOKEN_WAIV.WELCOME_DAILY_WEIGHT) * TOKEN_WAIV.WELCOME_DAILY_VOTE_TIME) / totalPostsCount);

    const { result: postJson } = await redis8.lpop({ key: WELCOME_Q_NAME });
    if (!postJson) {
      console.log('No more posts to process.');
      break;
    }

    const post = parseJson(postJson, null);
    if (!post) continue;

    const vote = {
      voter: process.env.WELCOME_BOT_NAME,
      author: post.author,
      permlink: post.permlink,
      weight: realWeight,
      key: process.env.WELCOME_BOT_KEY,
    };

    const { error: voteError } = await hiveOperations.likePost(vote);
    if (voteError) {
      console.error(`Error voting on ${vote.author}/${vote.permlink}:`, voteError.message);
      continue;
    }

    const welcomeKey = `${TOKEN_WAIV.WELCOME_REDIS}:${moment.utc().startOf('day').format()}`;
    await redis8.sadd({
      key: welcomeKey,
      member: `${vote.author}/${vote.permlink}/${vote.weight}`,
    });
    await redis8.expire({ key: welcomeKey, time: 345600 });
    console.log(`Successfully voted on ${vote.author}/${vote.permlink} with weight: ${vote.weight}`);
    spentWeight += realWeight;

    await setTimeout(sleepTimeMs);
  }
  await releaseLock();
};

const bootstrapWelcomeJob = async () => {
  await releaseLock();
  processFilteredPosts();
};

const getRsharesFilter = async () => {
  const dieselPools = await marketPools.getMarketPools(
    { query: { _id: TOKEN_WAIV.DIESEL_POOL_ID } },
  );
  const smtPools = await commentContract.getRewardPools({ query: { _id: TOKEN_WAIV.POOL_ID } });
  if (_.isEmpty(dieselPools) || _.isEmpty(smtPools)) return;
  const [dieselPool] = dieselPools;
  const [smtPool] = smtPools;

  const { quotePrice } = dieselPool;
  const { rewardPool, pendingClaims } = smtPool;

  const { usd, error } = await getGeckoPrice('HIVE', 'USD', (d) => _.get(d, 'data.hive'));
  if (error) {
    console.error(error.message);
    return;
  }

  const price = parseFloat(quotePrice) * usd;
  const rewards = parseFloat(rewardPool) / parseFloat(pendingClaims);
  const rsharesFilter = TOKEN_WAIV.WELCOME_USD_FILTER / (price * rewards);
  return rsharesFilter;
};

const getUsersFromPostsList = async ({ posts }) => {
  const rsharesFilter = await getRsharesFilter();

  const { result: users } = await userModel.find({
    filter: {
      name: { $in: _.uniq(_.map(posts, 'author')) },
      [TOKEN_WAIV.EXPERTISE_FIELD]: { $lt: rsharesFilter },
    },
    options: { projection: { [TOKEN_WAIV.EXPERTISE_FIELD]: 1, name: 1 } },
  });
  if (!users.length) {
    console.error('problems with user request');
  }
  console.log(`users filter: ${users.length}`);

  return users;
};

const filterPosts = ({ posts, users, voted }) => _
  .chain(posts)
  .filter((el) => _.includes(_.map(users, 'name'), el.author))
  .filter((el) => !_
    .some(
      _.map(voted, (vote) => {
        if (typeof vote === 'string') {
          return { author: vote.split('/')[0], permlink: vote.split('/')[1] };
        }
        return { author: '', permlink: '' };
      }),
      (v) => v.author === el.author && v.permlink === el.permlink,
    ))
  .uniqBy('author')
  .value();

const getValidRecords = async () => {
  const threeDaysAgo = moment.utc().subtract(3, 'days').startOf('day').format();
  const postsKey = `${REDIS_KEY.DISTRIBUTE_HIVE_ENGINE_REWARD}:${TOKEN_WAIV.SYMBOL}:${threeDaysAgo}`;

  const { result: records } = await redis8.smembers({ key: postsKey });
  return _.map(records, (el) => ({ author: el.split('/')[0], permlink: el.split('/')[1] }));
};

const getVotedPosts = async () => {
  const { result: voted } = await redis8.zrevrange({
    key: `${TOKEN_WAIV.CURATOR_VOTED}:${TOKEN_WAIV.SYMBOL}`,
    start: 0,
    stop: -1,
  });

  return voted;
};

const addPostToQ = async ({ post }) => {
  await redis8.rpush({
    key: WELCOME_Q_NAME,
    elements: JSON.stringify(post),
  });
};

const run = async () => {
  if (process.env.NODE_ENV !== 'production') return;
  console.log('start WELCOME job');

  const posts = await getValidRecords();
  if (_.isEmpty(posts)) return;
  const voted = await getVotedPosts();
  const users = await getUsersFromPostsList({ posts });
  const filteredPosts = filterPosts({ posts, users, voted });

  if (_.isEmpty(filteredPosts)) {
    console.log('filteredPosts empty');
    return;
  }

  for (const post of filteredPosts) await addPostToQ({ post });
  await redis8.expire({ key: WELCOME_Q_NAME, time: 345600 });

  await processFilteredPosts();
};

module.exports = { run, bootstrapWelcomeJob };
