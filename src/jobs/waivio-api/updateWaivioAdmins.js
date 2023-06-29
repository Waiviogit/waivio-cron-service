const _ = require('lodash');
const { appModel } = require('../../database/models');
const { APP_HOST } = require('../../constants/common');
const { redis9 } = require('../../redis');
const { REDIS_KEY } = require('../../constants/redis');

const updateWaivioAdmins = async () => {
  const { result, error } = await appModel.findOne({
    filter: { host: APP_HOST },
    options: {
      projection: { admins: 1, owner: 1 },
    },

  });

  if (error) return;

  const waivioAdmins = [..._.get(result, 'admins', []), _.get(result, 'owner')];
  await redis9.sadd({
    key: REDIS_KEY.WAIVIO_ADMINS, member: waivioAdmins,
  });
};

const run = async () => {
  await updateWaivioAdmins();
};

module.exports = {
  run,
};
