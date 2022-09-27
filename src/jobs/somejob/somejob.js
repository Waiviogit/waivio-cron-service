const { CronJob } = require('cron');
const { postsModel } = require('../../database/models');

console.log('kek');

const cacheHivePrice = new CronJob('0 */1 * * * *', async () => {
  const yo = await postsModel.find({ filter: { author: 'ctrl-news' } });
  console.log();
}, null, false, null, null, true);
