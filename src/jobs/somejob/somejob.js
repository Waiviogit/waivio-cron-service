const { CronJob } = require('cron');
const { postModel } = require('../../database/models');
const { redisGetter } = require('../../redis');

const cacheHivePrice = new CronJob('*/10 * * * * *', async () => {
  const kek = await redisGetter.get({ key: 'test' });
  const yo = await postModel.find({ filter: { author: 'ctrl-news' } });
  console.log();
}, null, false, null, null, false);

