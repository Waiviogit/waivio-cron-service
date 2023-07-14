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
  apiUpdatePostsCount,
  apiUpdateWaivioAdmins,
  apiWebsiteBalanceNotification,
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
apiUpdatePostsCount.start();
apiUpdateWaivioAdmins.start();
apiWebsiteBalanceNotification.start();
