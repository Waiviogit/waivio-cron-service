const moment = require('moment');
const _ = require('lodash');
const util = require('util');
const { expireClient } = require('../../redis');
const { userModel } = require('../../database/models');
const { hiveOperations } = require('../../utilities/hiveApi');
const marketPools = require('../../utilities/hiveEngine/marketPools');
const commentContract = require('../../utilities/hiveEngine/commentContract');
const { REDIS_KEY } = require('../../constants/redis');
const { getGeckoPrice } = require('../../helpers/congeckoHelper');
const { TOKEN_WAIV } = require('../../constants/hiveEngine');

const sleep = util.promisify(setTimeout);

const run = async () => {
  if (process.env.NODE_ENV !== 'production') return;
  console.log('start WELCOME job');
  const threeDaysAgo = moment.utc().subtract(3, 'days').startOf('day').format();
  const postsKey = `${REDIS_KEY.DISTRIBUTE_HIVE_ENGINE_REWARD}:${TOKEN_WAIV.SYMBOL}:${threeDaysAgo}`;
  const welcomeKey = `${TOKEN_WAIV.WELCOME_REDIS}:${moment.utc().startOf('day').format()}`;

  const { result: records } = await expireClient.smembers({ key: postsKey });

  const { result: voted } = await expireClient.zrevrange({
    key: `${TOKEN_WAIV.CURATOR_VOTED}:${TOKEN_WAIV.SYMBOL}`,
    start: 0,
    stop: -1,
  });

  if (_.isEmpty(records)) return;

  const postsList = _.map(records, (el) => ({ author: el.split('/')[0], permlink: el.split('/')[1] }));

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

  const { result: users } = await userModel.find({
    filter: {
      name: { $in: _.uniq(_.map(postsList, 'author')) },
      [TOKEN_WAIV.EXPERTISE_FIELD]: { $lt: rsharesFilter },
    },
    options: { projection: { [TOKEN_WAIV.EXPERTISE_FIELD]: 1, name: 1 } },
  });
  if (!users.length) {
    console.error('problems with user request');
  }
  console.log(`users filter: ${users.length}`);

  const filteredPosts = _
    .chain(postsList)
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

  if (_.isEmpty(filteredPosts)) {
    console.log('filteredPosts empty');
    return;
  }

  let spentWeight = 0;
  const estimatedWeightOnPost = TOKEN_WAIV.WELCOME_DAILY_WEIGHT / filteredPosts.length;
  const realWeight = estimatedWeightOnPost > 10000
    ? 10000
    : Math.ceil(estimatedWeightOnPost);

  const sleepTime = Math.floor(TOKEN_WAIV.WELCOME_DAILY_VOTE_TIME / filteredPosts.length);
  console.log('start WELCOME voting...');
  for (const post of filteredPosts) {
    const vote = {
      voter: process.env.WELCOME_BOT_NAME,
      author: post.author,
      permlink: post.permlink,
      weight: realWeight,
      key: process.env.WELCOME_BOT_KEY,
    };
    const { error: voteError } = await hiveOperations.likePost(vote);
    if (voteError) {
      console.error(voteError.message);
      continue;
    }

    await expireClient.sadd({ key: welcomeKey, member: `${vote.author}/${vote.permlink}/${vote.weight}` });
    await expireClient.expire({ key: welcomeKey, time: 345600 });
    console.log(`success vote on ${vote.author}/${vote.permlink} weight: ${vote.weight}`);
    await sleep(sleepTime);
    spentWeight += realWeight;
    if (spentWeight >= TOKEN_WAIV.WELCOME_DAILY_WEIGHT) return;
  }
};

module.exports = { run };
