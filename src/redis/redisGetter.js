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

const smembers = async ({ key, client = db8Client }) => {
  try {
    const result = await client.smembers(key);
    return { result };
  } catch (error) {
    return { error };
  }
};

const zrevrange = async ({
  key, start, stop, client = db8Client,
}) => {
  try {
    const result = await client.zrevrange(key, start, stop);
    return { result };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  get,
  smembers,
  zrevrange,
};
