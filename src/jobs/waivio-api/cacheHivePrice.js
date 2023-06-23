const { getRewardFund, getCurrentMedianHistoryPrice } = require('../../utilities/hiveApi/hiveOperations');
const { REDIS_KEY } = require('../../constants/redis');
const { lastBlockClient } = require('../../redis');

const cacheRewardFund = async () => {
  const { result, error } = await getRewardFund();
  if (error) return;
  await lastBlockClient.hmset({ key: REDIS_KEY.REWARD_FUND, data: result });
};

const cacheCurrentMedianHistoryPrice = async () => {
  const { result, error } = await getCurrentMedianHistoryPrice();
  if (error) return;
  await lastBlockClient.hmset({ key: REDIS_KEY.CURRENT_MEDIAN_HISTORY_PRICE, data: result });
};

const run = async () => {
  await cacheRewardFund();
  await cacheCurrentMedianHistoryPrice();
};

module.exports = {
  run,
};
