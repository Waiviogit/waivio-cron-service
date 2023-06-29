const {
  updatePostVotesJob,
  updatePostChildrenJob,
  waivioWelcomeJob,
  apiCacheHivePrice,
  apiCacheServiceBots,
  apiCollectAppExperts,
  apiCollectWobjectExperts,
  apiImportUsers,
  apiErroredUsers,
  apiSendWebsiteDebt,
  apiUpdateObjTypeExperts,
  apiUpdateSiteObjects,
  apiUpdateTopObjects,
} = require('./jobs');

updatePostVotesJob.start();
updatePostChildrenJob.start();
waivioWelcomeJob.start();

apiCacheHivePrice.start();
apiCacheServiceBots.start();
apiCollectAppExperts.start();
apiCollectWobjectExperts.start();
apiImportUsers.start();
apiErroredUsers.start();
apiSendWebsiteDebt.start();
apiUpdateObjTypeExperts.start();
apiUpdateSiteObjects.start();
apiUpdateTopObjects.start();
