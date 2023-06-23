const axios = require('axios');

const getGeckoPrice = async (ids, vsCurrencies, cb) => {
  try {
    const result = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vsCurrencies}`,
    );
    return cb(result);
  } catch (e) {
    return { error: e };
  }
};

module.exports = {
  getGeckoPrice,
};
