const _ = require('lodash');
const {
  STATUSES, TEST_DOMAINS, FEE, PAYMENT_DESCRIPTION,
} = require('../../constants/sitesConstants');
const { OBJECT_BOT } = require('../../constants/requestData');
const { appModel } = require('../../database/models');
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
      },
    },
  });
  if (error) return sendError(error);
  for (const app of apps) {
    /** Collect data for debt calculation */

    const { result: todayUsers } = await redis11.smembers({ key: `${REDIS_KEY.SITE_USERS_STATISTIC}:${app.host}` });
    const countUsers = _.get(todayUsers, 'length', 0);

    const data = {
      amount: calcDailyDebtInvoice({ countUsers, status: app.status }),
      description: addDescriptionMessage(app.status),
      userName: app.owner,
      countUsers,
      host: app.host,
    };
    const { error: createError } = await objectBotRequests.sendCustomJson(
      data,
      `${OBJECT_BOT.HOST}${OBJECT_BOT.BASE_URL}${OBJECT_BOT.SEND_INVOICE}`,
      false,
    );
    await redis11.del({ key: `${REDIS_KEY.SITE_USERS_STATISTIC}:${app.host}` });
    if (createError) {
      console.error(`Request for create invoice for host ${data.host} 
      with amount ${data.amount}, daily users: ${data.countUsers} failed!`);
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

const calcDailyDebtInvoice = ({ countUsers, status }) => {
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

const run = async () => {
  await dailySuspendedDebt();
  await dailyDebt();
};

module.exports = {
  run,
};
