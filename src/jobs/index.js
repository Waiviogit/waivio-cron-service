const {
  updatePostVotesJob,
  updatePostChildrenJob,
  waivioWelcomeJob,
  apiCacheHivePrice,
  // apiCacheServiceBots,
  apiCollectAppExperts,
  apiCollectWobjectExperts,
  apiImportUsers,
  apiErroredUsers,
  apiSendWebsiteDebt,
  apiUpdateObjTypeExperts,
  apiUpdateSiteObjects,
  apiUpdateTopObjects,
  apiUpdatePostsCount,
  apiUpdateWaivioAdmins,
  apiWebsiteBalanceNotification,
  hiveNodeJob,
  ratesJob,
  hiveEngineNodeJob,
  apiSetActiveSites,
  apiGoodUrlHash,
} = require('./jobs');

updatePostVotesJob.start();
updatePostChildrenJob.start();
waivioWelcomeJob.start();

apiCacheHivePrice.start();
apiSetActiveSites.start();
// apiCacheServiceBots.start();
// for now we don't use it
// apiCollectAppExperts.start();
apiCollectWobjectExperts.start();
apiImportUsers.start();
apiErroredUsers.start();
apiSendWebsiteDebt.start();
apiUpdateObjTypeExperts.start();
apiUpdateSiteObjects.start();
apiUpdateTopObjects.start();
apiUpdatePostsCount.start();
apiUpdateWaivioAdmins.start();
apiWebsiteBalanceNotification.start();
apiGoodUrlHash.start();

hiveNodeJob.start();
ratesJob.start();
hiveEngineNodeJob.start();
