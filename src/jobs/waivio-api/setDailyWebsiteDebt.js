const _ = require('lodash');
const {
  STATUSES, TEST_DOMAINS, FEE, PAYMENT_DESCRIPTION, BILLING_TYPE,
} = require('../../constants/sitesConstants');
const { OBJECT_BOT } = require('../../constants/requestData');
const { appModel, siteStatisticModel } = require('../../database/models');
const { redis11 } = require('../../redis');
const { REDIS_KEY } = require('../../constants/redis');
const { objectBotRequests } = require('../../utilities/objectBot');
const { sendError } = require('../../helpers/sentryHelper');

const dailyDebt = async (timeout = 200) => {
  const { result: apps, error } = await appModel.find({
    filter: {
      inherited: true,
      status: { $in: [STATUSES.INACTIVE, STATUSES.PENDING, STATUSES.ACTIVE] },
    },
    options: {
      projection: {
        host: 1,
        parent: 1,
        owner: 1,
        status: 1,
        billingType: 1,
      },
    },
  });
  if (error) return sendError(error);
  for (const app of apps) {
    const {
      parent, host, owner, status, billingType,
    } = app;

    /** Collect data for debt calculation */

    const countUsers = await getDailyVisitorsByHost(host);
    const data = {
      amount: calcDailyDebtInvoice({
        countUsers,
        status,
        billingType,
      }),
      description: addDescriptionMessage(status),
      userName: owner,
      countUsers,
      host,
    };
    const { error: createError } = await objectBotRequests.sendCustomJson(
      data,
      `${OBJECT_BOT.HOST}${OBJECT_BOT.BASE_URL}${OBJECT_BOT.SEND_INVOICE}`,
      false,
    );
    await createSiteStatisticRecord({
      visits: countUsers,
      host,
    });

    await deleteVisitorsByHost(host);
    if (createError) {
      console.error(`Request for create invoice for host ${host} 
      with amount ${data.amount}, daily users: ${countUsers} failed!`);
      await sendError(Object.assign(createError, data));
      continue;
    }

    await new Promise((resolve) => setTimeout(resolve, timeout));
  }
};

const checkForTestSites = async (parent) => {
  const { result, error } = await appModel.findOne(
    { filter: { _id: parent }, options: { projection: { host: 1 } } },
  );
  if (error) {
    await sendError(error);
    return false;
  }
  if (process.env.NODE_ENV === 'staging' && _.includes(TEST_DOMAINS, result.host)) return true;
  return process.env.NODE_ENV === 'production' && !_.includes(TEST_DOMAINS, result.host);
};

const dailySuspendedDebt = async (timeout = 200) => {
  const { result: apps, error } = await appModel.find({
    filter: {
      inherited: true, status: STATUSES.SUSPENDED,
    },
    options: {
      projection: {
        host: 1,
        parent: 1,
        owner: 1,
        status: 1,
      },
    },
  });
  if (error) return sendError(error);
  for (const app of apps) {
    const data = {
      description: addDescriptionMessage(app.status),
      amount: FEE.perInactive,
      userName: app.owner,
      host: app.host,
      countUsers: 0,
    };

    const { error: createError } = await objectBotRequests.sendCustomJson(
      data,
      `${OBJECT_BOT.HOST}${OBJECT_BOT.BASE_URL}${OBJECT_BOT.SEND_INVOICE}`,
      false,
    );
    if (createError) {
      console.error(`Request for create invoice for suspended host ${data.host} 
      with amount ${data.amount}, daily users: ${data.countUsers} failed!`);
      await sendError(Object.assign(createError, data));
      continue;
    }

    await new Promise((resolve) => setTimeout(resolve, timeout));
  }
};

const getDailyVisitorsByHost = async (host) => {
  const { result: todayUsers } = await redis11.smembers({ key: `${REDIS_KEY.SITE_USERS_STATISTIC}:${host}` });
  return todayUsers?.length || 0;
};

const getBuyActionByHost = async (host) => {
  const { result: actions } = await redis11.get({ key: `${REDIS_KEY.SITES_ACTION_TOTAL}:${host}` });
  if (actions) return parseFloat(actions);
  return 0;
};

const getUniqActionByHost = async (host) => {
  const { result: actions } = await redis11.smembers({ key: `${REDIS_KEY.SITES_ACTION_UNIQ}:${host}` });
  return actions?.length || 0;
};

const deleteSiteActionsByHost = async (host) => {
  await redis11.del({ key: `${REDIS_KEY.SITES_ACTION_TOTAL}:${host}` });
  await redis11.del({ key: `${REDIS_KEY.SITES_ACTION_UNIQ}:${host}` });
};

const deleteVisitorsByHost = async (host) => {
  await redis11.del({ key: `${REDIS_KEY.SITE_USERS_STATISTIC}:${host}` });
};

const createSiteStatisticRecord = async ({ visits, host }) => {
  let buyAction = 0, buyActionUniq = 0, conversion = 0, conversionUniq = 0;
  if (visits !== 0) {
    buyAction = await getBuyActionByHost(host);
    buyActionUniq = await getUniqActionByHost(host);
    conversion = (buyAction * 100) / visits;
    conversionUniq = (buyActionUniq * 100) / visits;
  }

  await siteStatisticModel.insertOne({
    doc: {
      host,
      visits,
      buyAction,
      buyActionUniq,
      conversion,
      conversionUniq,
    },
    timestamps: true,
  });

  await deleteSiteActionsByHost(host);
};

const calcDailyDebtInvoice = ({ countUsers, status, billingType }) => {
  if (billingType === BILLING_TYPE.PAYPAL_SUBSCRIPTION) return 0;
  if (status === STATUSES.ACTIVE) {
    return countUsers * FEE.perUser < FEE.minimumValue
      ? FEE.minimumValue
      : _.round(countUsers * FEE.perUser, 3);
  }
  return FEE.perInactive;
};

const addDescriptionMessage = (status) => {
  if (status === STATUSES.ACTIVE) return PAYMENT_DESCRIPTION.HOSTING_FEE;
  return PAYMENT_DESCRIPTION.RESERVATION;
};

const mainStatistic = async () => {
  const { result: apps, error } = await appModel.find({
    filter: {
      inherited: false,
      status: STATUSES.ACTIVE,
    },
    options: {
      projection: { host: 1 },
    },
  });
  if (error) return sendError(error);

  for (const app of apps) {
    const { host } = app;
    const visits = await getDailyVisitorsByHost(host);
    await createSiteStatisticRecord({ visits, host });
    await deleteVisitorsByHost(host);
  }
};

const run = async () => {
  await dailySuspendedDebt();
  await dailyDebt();
  await mainStatistic();
};

module.exports = {
  run,
};
