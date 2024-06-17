const _ = require('lodash');
const axios = require('axios');
const { sendError } = require('../../helpers/sentryHelper');

exports.sendCustomJson = async (data, url, sendSentry = true) => {
  try {
    const result = await axios.post(
      url,
      data,
      {
        headers: {
          api_key: process.env.API_KEY,
          'access-key': process.env.OBJECT_BOT_ACCESS_KEY,
        },
      },
    );
    return { result: _.get(result, 'data.result') };
  } catch (error) {
    if (sendSentry) {
      await sendError(error);
    }
    return { error };
  }
};
