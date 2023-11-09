const _ = require('lodash');
const { redis2 } = require('../../redis');
const { REDIS_KEY } = require('../../constants/redis');
const { sendTelegramWarning } = require('../../helpers/sentryHelper');

const MAX_RPM = 3000;

const run = async () => {
  const rates = [];
  let currentMinute = new Date().getMinutes();
  if (!currentMinute) currentMinute = 60;

  const keys = [];
  for (let i = 0; i < 5; i++) {
    keys.push(`${REDIS_KEY.REQUESTS_RATE_API}${currentMinute - (i + 1)}`);
  }
  await Promise.all(keys.map(async (key) => {
    const { result: rate } = await redis2.get({ key });
    if (rate) rates.push(Number(rate));
  }));

  const avg = _.mean(rates);

  const { result: maxRedis } = await redis2.get({ key: REDIS_KEY.REQUESTS_RATE_WARNING_LIMIT });

  const max = maxRedis ? Number(maxRedis) : MAX_RPM;
  if (avg > max) {
    await sendTelegramWarning({ message: `RPM on api: ${avg}` });
  }
  console.log(`AVG RPM API: ${avg}`);
};

module.exports = {
  run,
};
