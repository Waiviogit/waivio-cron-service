const { redis8 } = require('../../redis');
const { REDIS_KEY } = require('../../constants/redis');
const { appModel } = require('../../database/models');

const run = async () => {
  const { result: apps } = await appModel
    .find({
      filter: { status: 'active' },
      options: { projection: { host: 1 } },
    });

  const dataToSave = apps.map((el) => `https://${el.host}`);
  if (!dataToSave) return;

  await redis8.set({ key: REDIS_KEY.CORS_WHITELIST, data: JSON.stringify(dataToSave) });
};

module.exports = {
  run,
};
