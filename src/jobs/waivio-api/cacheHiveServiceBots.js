const _ = require('lodash');
const { appModel } = require('../../database/models');
const { APP_HOST } = require('../../constants/common');
const { redis8 } = require('../../redis');
const { REDIS_KEY } = require('../../constants/redis');

const cacheHiveServiceBots = async () => {
  const { result, error } = await appModel.findOne({
    filter: { host: APP_HOST },
  });
  if (error) return;
  if (!result) return;
  await redis8.sadd({
    key: REDIS_KEY.CACHE_SERVICE_BOTS,
    member: _.map(result.service_bots, (bot) => JSON.stringify(bot)),
  });
};

const run = async () => {
  await cacheHiveServiceBots();
};

module.exports = {
  run,
};
