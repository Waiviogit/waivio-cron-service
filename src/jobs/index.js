const {
  updatePostVotesJob,
  updatePostChildrenJob,
  waivioWelcomeJob,
} = require('./jobs');

updatePostVotesJob.start();
updatePostChildrenJob.start();
waivioWelcomeJob.start();

// apiCacheHivePrice.start();
// apiCacheServiceBots.start();
// for now we don't use it
// apiCollectAppExperts.start();
// apiCollectWobjectExperts.start();
// apiImportUsers.start();
// apiErroredUsers.start();
// apiSendWebsiteDebt.start();
// apiUpdateObjTypeExperts.start();
// apiUpdateSiteObjects.start();
// apiUpdateTopObjects.start();
// apiUpdatePostsCount.start();
// apiUpdateWaivioAdmins.start();
// apiWebsiteBalanceNotification.start();
