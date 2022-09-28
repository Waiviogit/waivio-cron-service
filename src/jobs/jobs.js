const { CronJob } = require('cron');
const noroutine = require('noroutine');
const updateVotes = require('./posts/updateVotes');
const updateChildren = require('./posts/updateChildren');
const waivioWelcome = require('./bots/waivioWelcome');
const { SCHEDULE } = require('../constants/cron');

noroutine.init({
  modules: [updateVotes, updateChildren],
  pool: 3, // number of workers in thread pool
  wait: 2000, // maximum delay to wait for a free thread
  timeout: 1000 * 60 * 60 * 24, // maximum timeout for executing a functions
  monitoring: 5000, // event loop utilization monitoring interval
});

// region posts
const updatePostVotesJob = new CronJob(
  SCHEDULE.UPDATE_POST_VOTES, async () => {
    try {
      await updateVotes.run();
    } catch (error) {
      console.log(`${updateVotes} ${error.message}`);
    }
  }, null, false, null, null, false,
);

const updatePostChildrenJob = new CronJob(
  SCHEDULE.UPDATE_POST_CHILDREN, async () => {
    try {
      await updateChildren.run();
    } catch (error) {
      console.log(`${updateChildren} ${error.message}`);
    }
  }, null, false, null, null, false,
);
// endregion

const waivioWelcomeJob = new CronJob(
  SCHEDULE.WAIVIO_WELCOME, async () => {
    try {
      await waivioWelcome.run();
    } catch (error) {
      console.log(`${waivioWelcome} ${error.message}`);
    }
  }, null, false, null, null, false,
);

module.exports = {
  updatePostVotesJob,
  updatePostChildrenJob,
  waivioWelcomeJob,
};
