const _ = require('lodash');
const { redis2 } = require('../../redis');
const { REDIS_KEY } = require('../../constants/redis');
const { sendTelegramWarning } = require('../../helpers/sentryHelper');

const MAX_RPM = 2500;

const run = async () => {
  const rates = [];
  const currentMinute = new Date().getMinutes();
  const keys = [];
  for (let i = 0; i < 5; i++) {
    keys.push(`${REDIS_KEY.REQUESTS_RATE_API}${currentMinute - (i + 1)}`);
  }
  await Promise.all(keys.map(async (key) => {
    const { result: rate } = await redis2.get({ key });
    if (rate) rates.push(Number(rate));
  }));

  const avg = _.mean(rates);
  if (avg > MAX_RPM) {
    await sendTelegramWarning({ message: `RPM on api: ${avg}` });
  }
  console.log(`AVG RPM API: ${avg}`);
};

module.exports = {
  run,
};
