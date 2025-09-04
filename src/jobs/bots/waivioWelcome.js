const moment = require('moment');
const _ = require('lodash');
const { setTimeout } = require('node:timers/promises');
const { redis8 } = require('../../redis');
const { userModel } = require('../../database/models');
const { hiveOperations } = require('../../utilities/hiveApi');
const marketPools = require('../../utilities/hiveEngine/marketPools');
const commentContract = require('../../utilities/hiveEngine/commentContract');
const tokensContract = require('../../utilities/hiveEngine/tokensContract');
const { REDIS_KEY } = require('../../constants/redis');
const { getGeckoPrice } = require('../../helpers/congeckoHelper');
const { TOKEN_WAIV } = require('../../constants/hiveEngine');
const { parseJson } = require('../../helpers/jsonHelper');

const WELCOME_Q_NAME = 'posting_q_waivio_welcome';
const LOCK_KEY = 'posting_q_waivio_welcome_lock';
const MAX_WAIV_BALANCE = 100;

const WELCOME_JOB_NAME = '[WELCOME BOT]';

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

const getWaivBalance = async (account) => {
  const result = await tokensContract.getTokenBalances({ query: { symbol: 'WAIV', account } });
  if (!result?.[0]) {
    return {
      balance: 0, stake: 0, delegationsOut: 0, pendingUnstake: 0, pendingUndelegations: 0,
    };
  }

  return {
    balance: parseFloat(result[0].balance),
    stake: parseFloat(result[0].stake),
    delegationsOut: parseFloat(result[0].delegationsOut),
    pendingUnstake: parseFloat(result[0].pendingUnstake),
    pendingUndelegations: parseFloat(result[0].pendingUndelegations),
  };
};

const calcTotalWaiv = (balances) => _.reduce(balances, (acc, el) => {
  if (Number.isNaN(el)) return acc;
  acc += el;
  return acc;
}, 0);

const acquireLock = async () => {
  const { result } = await redis8.setWithMode({
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
  if (process.env.NODE_ENV !== 'production') return;
  const lockAcquired = await acquireLock();
  if (!lockAcquired) {
    console.log(`${WELCOME_JOB_NAME}Another instance is already processing filtered posts.`);
    return;
  }

  let spentWeight = 0;

  console.log(`${WELCOME_JOB_NAME} Starting WELCOME voting...`);

  while (spentWeight < TOKEN_WAIV.WELCOME_DAILY_WEIGHT) {
    const { result: totalPostsCount } = await redis8.llen({ key: WELCOME_Q_NAME });
    if (totalPostsCount === 0) {
      console.log(`${WELCOME_JOB_NAME} No more posts to process.`);
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
    if (!post) {
      console.log(`${WELCOME_JOB_NAME}: error parsing post`);
      continue;
    }

    const { result: inGreyList } = await redis8
      .sismember({ key: REDIS_KEY.GREY_LIST_KEY, member: post.author });
    if (inGreyList) {
      console.log(`${WELCOME_JOB_NAME}: author ${post.author} is in grey list`);
      continue;
    }
    const postAuthorBalances = await getWaivBalance(post.author);
    const totalWaiv = calcTotalWaiv(postAuthorBalances);
    if (totalWaiv > MAX_WAIV_BALANCE) {
      console.log(`${WELCOME_JOB_NAME}: author ${post.author} totalWaiv (${totalWaiv}) > MAX_WAIV_BALANCE adding to grey list`);
      await redis8.sadd({ key: REDIS_KEY.GREY_LIST_KEY, member: post.author });
      continue;
    }

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
    console.error(`${WELCOME_JOB_NAME} problems with user request`);
  }
  console.log(`${WELCOME_JOB_NAME} users filter: ${users.length}`);

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
  console.log(`${WELCOME_JOB_NAME} records key: ${postsKey}`);

  const { result: records } = await redis8.smembers({ key: postsKey });
  console.log(`${WELCOME_JOB_NAME} valid records length ${records?.length || 0}`);
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
  console.log(`${WELCOME_JOB_NAME}: ${post.author}/${post.permlink} added to queue`);
};

const run = async () => {
  if (process.env.NODE_ENV !== 'production') return;
  console.log(`${WELCOME_JOB_NAME}: start WELCOME job`);

  const posts = await getValidRecords();
  if (_.isEmpty(posts)) return;
  const voted = await getVotedPosts();
  const users = await getUsersFromPostsList({ posts });
  const filteredPosts = filterPosts({ posts, users, voted });

  if (_.isEmpty(filteredPosts)) {
    console.log(`${WELCOME_JOB_NAME}: filteredPosts empty`);
    return;
  }

  for (const post of filteredPosts) await addPostToQ({ post });
  await redis8.expire({ key: WELCOME_Q_NAME, time: 345600 });

  await processFilteredPosts();
};

module.exports = { run, bootstrapWelcomeJob };
