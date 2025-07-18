const { CronJob } = require('cron');
const updateVotes = require('./posts/updateVotes');
const updateChildren = require('./posts/updateChildren');
const waivioWelcome = require('./bots/waivioWelcome');
const cacheHivePrice = require('./waivio-api/cacheHivePrice');
// const cacheHiveServiceBots = require('./waivio-api/cacheHiveServiceBots');
const collectAppExperts = require('./waivio-api/collectAppExperts');
const collectWobjTopUsers = require('./waivio-api/collectWobjTopUsers');
const importUsers = require('./waivio-api/importUsers');
const setDailyWebsiteDebt = require('./waivio-api/setDailyWebsiteDebt');
const updateObjectTypeExperts = require('./waivio-api/updateObjectTypeExperts');
const updateTopWobjJob = require('./waivio-api/updateTopWobjJob');
const updatePostsCount = require('./waivio-api/updatePostsCount');
const updateWaivioAdmins = require('./waivio-api/updateWaivioAdmins');
const websiteBalanceNotification = require('./waivio-api/websiteBalanceNotification');
const updateSiteWobjects = require('./waivio-api/updateSiteWobjects');
const setActiveSites = require('./waivio-api/setActiveSites');
const goodUrlHash = require('./waivio-api/goodUrlHash');
const checkHiveNode = require('./nodes/checkHiveNode');
const checkHiveEngineNodes = require('./nodes/checkHiveEngineNodes');
const apiReqRates = require('./rates/apiReqRates');
const { SCHEDULE } = require('../constants/cron');
const { REDIS_KEY } = require('../constants/redis');

// noroutine.init({
//   modules: [updateVotes, updateChildren],
//   pool: 3, // number of workers in thread pool
//   wait: 2000, // maximum delay to wait for a free thread
//   timeout: 1000 * 60 * 60 * 24, // maximum timeout for executing a functions
//   monitoring: 5000, // event loop utilization monitoring interval
// });

// region posts
const updatePostVotesJob = new CronJob(SCHEDULE.UPDATE_POST_VOTES, async () => {
  try {
    await updateVotes.run();
  } catch (error) {
    console.log(`${updateVotes} ${error.message}`);
  }
}, null, false, null, null, false);

const updatePostChildrenJob = new CronJob(SCHEDULE.UPDATE_POST_CHILDREN, async () => {
  try {
    await updateChildren.run();
  } catch (error) {
    console.log(`${updateChildren} ${error.message}`);
  }
}, null, false, null, null, false);
// endregion

const waivioWelcomeJob = new CronJob(SCHEDULE.WAIVIO_WELCOME, async () => {
  try {
    await waivioWelcome.run();
  } catch (error) {
    console.log(`waivioWelcome ${error.message}`);
  }
}, null, false, null, null, false);

// region api
const apiCacheHivePrice = new CronJob(SCHEDULE.WAIVIO_API_CACHE_HIVE_PRICE, async () => {
  try {
    await cacheHivePrice.run();
  } catch (error) {
    console.log(`cacheHivePrice ${error.message}`);
  }
}, null, false, null, null, false);

const apiSetActiveSites = new CronJob(SCHEDULE.SET_ACTIVE_SITES, async () => {
  try {
    await setActiveSites.run();
  } catch (error) {
    console.log(`apiSetActiveSites ${error.message}`);
  }
}, null, false, null, null, true);

// const apiCacheServiceBots = new CronJob(SCHEDULE.WAIVIO_API_SERVICE_BOTS, async () => {
//   try {
//     await cacheHiveServiceBots.run();
//   } catch (error) {
//     console.log(`apiCacheServiceBots ${error.message}`);
//   }
// }, null, false, null, null, false);

// for now we don't use it
const apiCollectAppExperts = new CronJob(SCHEDULE.WAIVIO_API_COLLECT_APP_EXPERTS, async () => {
  try {
    await collectAppExperts.run();
  } catch (error) {
    console.log(`apiCollectAppExperts ${error.message}`);
  }
}, null, false, null, null, false);

const apiCollectWobjectExperts = new CronJob(
  SCHEDULE.WAIVIO_API_COLLECT_WOBJECT_EXPERTS,
  async () => {
    try {
      await collectWobjTopUsers.run();
    } catch (error) {
      console.log(`apiCollectWobjectExperts ${error.message}`);
    }
  },
  null,
  false,
  null,
  null,
  false,
);

const apiImportUsers = new CronJob(SCHEDULE.WAIVIO_API_IMPORT_USERS, async () => {
  try {
    await importUsers.run(REDIS_KEY.IMPORTED_USER);
  } catch (error) {
    console.log(`apiImportUsers ${error.message}`);
  }
}, null, false, null, null, false);

const apiErroredUsers = new CronJob(SCHEDULE.WAIVIO_API_IMPORT_ERROR_USERS, async () => {
  try {
    await importUsers.run(REDIS_KEY.IMPORTED_USER_ERROR);
  } catch (error) {
    console.log(`apiErroredUsers ${error.message}`);
  }
}, null, false, null, null, false);

const apiSendWebsiteDebt = new CronJob(SCHEDULE.WAIVIO_API_SEND_WEBSITE_DAILY_DEBT, async () => {
  try {
    await setDailyWebsiteDebt.run();
  } catch (error) {
    console.log(`apiSendWebsiteDebt ${error.message}`);
  }
}, null, false, null, null, false);

const apiUpdateObjTypeExperts = new CronJob(SCHEDULE.WAIVIO_API_UPDATE_OBJ_TYPE_EXPERTS, async () => {
  try {
    await updateObjectTypeExperts.run();
  } catch (error) {
    console.log(`apiUpdateObjTypeExperts ${error.message}`);
  }
}, null, false, null, null, false);

const apiUpdateSiteObjects = new CronJob(SCHEDULE.WAIVIO_API_UPDATE_SITE_OBJECTS, async () => {
  try {
    await updateSiteWobjects.run();
  } catch (error) {
    console.log(`apiUpdateSiteObjects ${error.message}`);
  }
}, null, false, null, null, false);

const apiUpdateTopObjects = new CronJob(SCHEDULE.WAIVIO_API_UPDATE_TOP_OBJECTS, async () => {
  try {
    await updateTopWobjJob.run();
  } catch (error) {
    console.log(`apiUpdateTopObjects ${error.message}`);
  }
}, null, false, null, null, false);

const apiUpdatePostsCount = new CronJob(SCHEDULE.WAIVIO_API_UPDATE_POSTS_COUNT, async () => {
  try {
    await updatePostsCount.run();
  } catch (error) {
    console.log(`apiUpdatePostsCount ${error.message}`);
  }
}, null, false, null, null, false);

const apiUpdateWaivioAdmins = new CronJob(SCHEDULE.WAIVIO_API_UPDATE_WAIVIO_ADMINS, async () => {
  try {
    await updateWaivioAdmins.run();
  } catch (error) {
    console.log(`apiUpdateWaivioAdmins ${error.message}`);
  }
}, null, false, null, null, false);

const apiWebsiteBalanceNotification = new CronJob(
  SCHEDULE.WAIVIO_API_WEBSITE_BALANCE_NOTIFICATION,
  async () => {
    try {
      await websiteBalanceNotification.run();
    } catch (error) {
      console.log(`apiWebsiteBalanceNotification ${error.message}`);
    }
  },
  null,
  false,
  null,
  null,
  false,
);

const apiGoodUrlHash = new CronJob(
  SCHEDULE.SAFE_SITE_UPDATE,
  async () => {
    try {
      await goodUrlHash.run();
    } catch (error) {
      console.log(`apiGoodUrlHash ${error.message}`);
    }
  },
  null,
  false,
  null,
  null,
  true,
);

// endregion

// region nodes
const hiveNodeJob = new CronJob(SCHEDULE.HIVE_NODE_CHECK, async () => {
  try {
    await checkHiveNode.run();
  } catch (error) {
    console.log(`checkHiveNode ${error.message}`);
  }
}, null, false, null, null, false);

const hiveEngineNodeJob = new CronJob(SCHEDULE.HIVE_ENGINE_CHECK, async () => {
  try {
    await checkHiveEngineNodes.run();
  } catch (error) {
    console.log(`hiveEngineNodeJob ${error.message}`);
  }
}, null, false, null, null, false);

// endregion

// region rates
const ratesJob = new CronJob(SCHEDULE.RPM_CHECK, async () => {
  try {
    await apiReqRates.run();
  } catch (error) {
    console.log(`ratesJob ${error.message}`);
  }
}, null, false, null, null, false);
// endregion

module.exports = {
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
};
