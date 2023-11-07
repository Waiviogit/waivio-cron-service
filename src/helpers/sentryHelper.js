const axios = require('axios');
const Sentry = require('@sentry/node');
const { TELEGRAM_API } = require('../constants/requestData');

const sendSentryNotification = async () => {
  try {
    if (!['staging', 'production'].includes(process.env.NODE_ENV)) return;
    const result = await axios.get(
      `${TELEGRAM_API.HOST}${TELEGRAM_API.BASE_URL}${TELEGRAM_API.SENTRY_ERROR}?app=waivioCron&env=${process.env.NODE_ENV}`,
      {
        timeout: 15000,
      },
    );
    return { result: result.data };
  } catch (error) {
    return { error };
  }
};

const sendTelegramWarning = async ({ message }) => {
  try {
    if (!['production'].includes(process.env.NODE_ENV)) return;
    const result = await axios.post(
      `${TELEGRAM_API.HOST}${TELEGRAM_API.BASE_URL}${TELEGRAM_API.WARNING_MESSAGE}`,
      {
        cron_service_key: process.env.CRON_SERVICE_KEY,
        message,
      },
      {
        timeout: 15000,
      },
    );
    return { result: result.data };
  } catch (error) {
    console.log('sendTelegramWarning Error:');
    console.log(error.message);
    return { error };
  }
};

const sendError = async (error) => {
  Sentry.captureException(error);
  await sendSentryNotification();
};

module.exports = {
  sendError,
  sendTelegramWarning,
};
