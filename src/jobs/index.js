const {
  updatePostVotesJob,
  updatePostChildrenJob,
  waivioWelcomeJob,
  apiCacheHivePrice,
  apiCacheServiceBots,
} = require('./jobs');

updatePostVotesJob.start();
updatePostChildrenJob.start();
waivioWelcomeJob.start();

apiCacheHivePrice.start();
apiCacheServiceBots.start();
