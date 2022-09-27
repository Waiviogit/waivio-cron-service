const { CronJob } = require('cron');
const noroutine = require('noroutine');
const updateVotesOnPost = require('./operations/updateVotesOnPost');

noroutine.init({
  modules: [updateVotesOnPost],
  pool: 3, // number of workers in thread pool
  wait: 2000, // maximum delay to wait for a free thread
  timeout: 1000 * 60 * 60 * 24, // maximum timeout for executing a functions
  monitoring: 5000, // event loop utilization monitoring interval
});

const updateVotesOnPostJob = new CronJob(
  '05 */1 * * *', async () => {
    try {
      await updateVotesOnPost.run();
    } catch (error) {
      console.log(`${updateVotesOnPost} error.message`);
    }
  }, null, false, null, null, false,
);

module.exports = {
  updateVotesOnPostJob,
};
