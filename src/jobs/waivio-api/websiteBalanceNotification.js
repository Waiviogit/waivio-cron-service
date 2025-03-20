const _ = require('lodash');
const BigNumber = require('bignumber.js');
const axios = require('axios');
const moment = require('moment');
const {
  NOTIFICATION, FEE, PAYMENT_TYPES, INACTIVE_STATUSES, BILLING_TYPE,
} = require('../../constants/sitesConstants');
const { appModel, userModel, websitePaymentsModel } = require('../../database/models');
const { REDIS_KEY } = require('../../constants/redis');
const { HOST, BASE_URL, SET_NOTIFICATION } = require('../../constants/requestData').NOTIFICATIONS_API;
const { redis11 } = require('../../redis');
const { sendError } = require('../../helpers/sentryHelper');

const sendNotification = async (reqData) => {
  const URL = HOST + BASE_URL + SET_NOTIFICATION;

  try {
    await axios.post(
      URL,
      reqData,
      {
        headers: { API_KEY: process.env.NOTIFICATIONS_KEY },
        timeout: 15000,
      },
    );
  } catch (error) {
    await sendError(error);
  }
};

const getDailyCost = (websites) => _
  .reduce(websites, (acc, site) => {
    if (_.includes(INACTIVE_STATUSES, site.status)) return BigNumber(FEE.perInactive).plus(acc);
    if (site.billingType === BILLING_TYPE.PAYPAL_SUBSCRIPTION) return acc;
    return site.averageDau < FEE.minimumValue / FEE.perUser
      ? BigNumber(FEE.minimumValue).plus(acc)
      : BigNumber(site.averageDau).multipliedBy(FEE.perUser).plus(acc);
  }, BigNumber(0));

const getWebsiteData = (payments, site) => {
  const lastWriteOff = _.filter(payments, (payment) => payment.host === site.host
      && payment.type === PAYMENT_TYPES.WRITE_OFF
      && payment.createdAt > moment.utc().subtract(7, 'day').startOf('day').toDate());

  return {
    status: site.status,
    name: site.name,
    host: site.host,
    parent: site.host.replace(`${site.name}.`, ''),
    averageDau: lastWriteOff.length
      ? Math.trunc(_.meanBy(lastWriteOff, (writeOff) => writeOff.countUsers))
      : 0,
  };
};

const getSumByPaymentType = (payments, types) => _
  .chain(payments)
  .filter((el) => types.includes(el.type))
  .reduce((acc, payment) => new BigNumber(payment.amount).plus(acc), new BigNumber(0))
  .value();

const getPaymentsData = async () => {
  const { result: user } = await userModel.findOne({
    filter: { name: FEE.account },
    options: {
      projection: {
        alias: 1, json_metadata: 1, posting_json_metadata: 1, name: 1,
      },
    },
  });
  return { user, memo: FEE.id };
};

const getWebsitePayments = async ({
  owner, host, startDate, endDate,
}) => {
  const { result: apps, error: appsError } = await appModel.find({
    filter: { owner, inherited: true },
    options: {
      sort: { _id: -1 },
    },
  });
  if (appsError) return { error: appsError };
  const { result: allExistingApps } = await websitePaymentsModel
    .distinct({ key: 'host', filter: { userName: owner } });
  const currentApps = _.map(apps, 'host');
  const ownerAppNames = _.uniq([...currentApps, ...allExistingApps]);

  const condition = host
    ? { host, userName: owner }
    : { userName: owner };

  const { error: paymentError, result: payments } = await websitePaymentsModel.find({
    filter: {
      ...condition,
      $and: [
        { createdAt: { $gt: startDate || moment.utc(1).toDate() } },
        { createdAt: { $lt: endDate || moment.utc().toDate() } }],
    },
    options: {
      sort: { createdAt: 1 },
    },

  });
  if (paymentError) return { error: paymentError };
  return {
    ownerAppNames,
    payments,
    apps,
  };
};
const getManagePage = async ({ userName }) => {
  const { error, apps, payments } = await getWebsitePayments({ owner: userName });
  if (error) return { error };
  const accountBalance = {
    paid: 0, avgDau: 0, dailyCost: 0, remainingDays: 0,
  };
  accountBalance.paid = getSumByPaymentType(payments, [PAYMENT_TYPES.TRANSFER, PAYMENT_TYPES.CREDIT])
    .minus(getSumByPaymentType(payments, [PAYMENT_TYPES.WRITE_OFF]))
    .toNumber();

  const dataForPayments = await getPaymentsData();
  const prices = {
    minimumValue: FEE.minimumValue,
    perSuspended: FEE.perInactive,
    perUser: FEE.perUser,
  };

  if (!apps.length) {
    return {
      accountBalance, dataForPayments, websites: [], prices,
    };
  }

  const websites = [];
  for (const site of apps) {
    websites.push(getWebsiteData(payments, site));
  }

  accountBalance.avgDau = _.sumBy(websites, (site) => site.averageDau) || 0;

  accountBalance.dailyCost = getDailyCost(websites).toNumber();

  accountBalance.remainingDays = accountBalance.dailyCost > 0
    ? Math.trunc(accountBalance.paid > 0 ? accountBalance.paid / accountBalance.dailyCost : 0)
    : 0;

  return {
    websites,
    accountBalance,
    dataForPayments,
    prices,
  };
};

const incrementWebsitesSuspended = async ({ key, expire }) => {
  const { result: counter } = await redis11.incr({ key: `${REDIS_KEY.WEBSITE_SUSPENDED_COUNT}:${key}` });
  await redis11.expire({ key: `${REDIS_KEY.WEBSITE_SUSPENDED_COUNT}:${key}`, time: expire });
  return counter;
};

const getMessage = async ({ remainingDays, paid, owner }) => {
  if (paid < 0) {
    const suspendedDays = await incrementWebsitesSuspended({ key: owner, expire: 3600 * 25 });
    if (suspendedDays < 100) return NOTIFICATION.SUSPENDED;
    return '';
  }

  const messages = {
    90: () => NOTIFICATION.OUT_THREE_MONTHS,
    60: () => NOTIFICATION.OUT_TWO_MONTHS,
    30: () => NOTIFICATION.OUT_MONTH,
    21: () => NOTIFICATION.OUT_THREE_WEEKS,
    14: () => NOTIFICATION.OUT_TWO_WEEKS,
    7: () => NOTIFICATION.OUT_WEEK,
    6: () => NOTIFICATION.OUT_SIX_DAYS,
    5: () => NOTIFICATION.OUT_FIVE_DAYS,
    4: () => NOTIFICATION.OUT_FOUR_DAYS,
    3: () => NOTIFICATION.OUT_THREE_DAYS,
    2: () => NOTIFICATION.OUT_TWO_DAYS,
    1: () => NOTIFICATION.OUT_DAY,
    default: () => '',
  };
  return (messages[remainingDays] || messages.default)();
};
const websiteBalanceNotification = async () => {
  const { result } = await appModel.find({ filter: { inherited: true, canBeExtended: false } });
  const owners = _.uniq(_.map(result, 'owner'));
  if (_.isEmpty(owners)) return;
  const requestData = [];

  for (const owner of owners) {
    const { accountBalance, error } = await getManagePage({ userName: owner });
    if (error) continue;
    const remainingDays = _.get(accountBalance, 'remainingDays', 0);
    const paid = _.get(accountBalance, 'paid');
    const message = await getMessage({ remainingDays, paid, owner });
    if (message) requestData.push({ owner, message });
  }

  if (_.isEmpty(requestData)) return;
  return sendNotification({ id: NOTIFICATION.BALANCE_ID, data: requestData });
};

const run = async () => {
  await websiteBalanceNotification();
};

module.exports = {
  run,
};
