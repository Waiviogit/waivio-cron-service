const {
  db8Client,
} = require('./redis');

const get = async ({ key, client = db8Client }) => {
  try {
    const result = await client.get(key);
    return { result };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  get,
};
