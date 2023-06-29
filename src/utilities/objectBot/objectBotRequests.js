const _ = require('lodash');
const axios = require('axios');

exports.sendCustomJson = async (data, url, sendSentry = true) => {
  try {
    const result = await axios.post(
      url,
      data,
      {
        headers: { api_key: process.env.API_KEY },
      },
    );
    return { result: _.get(result, 'data.result') };
  } catch (error) {
    if (sendSentry) {
      Sentry.captureException(error);
      await sendSentryNotification(error);
    }
    return { error };
  }
};