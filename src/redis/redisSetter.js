const { db8Client } = require('./redis');

const del = async ({ key, client = db8Client }) => {
  try {
    const result = await client.del(key);
    return { result };
  } catch (error) {
    return { error };
  }
};

const expire = async ({ key, time, client = db8Client }) => {
  try {
    const result = await client.expire(key, time);
    return { result };
  } catch (error) {
    return { error };
  }
};

const sadd = async ({ key, member, client = db8Client }) => {
  try {
    const result = await client.sadd(key, member);
    return { result };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  del,
  expire,
  sadd,
};
