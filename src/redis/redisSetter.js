const { db8Client } = require('./redis');

const del = async ({ key, client = db8Client }) => {
  try {
    const result = await client.del(key);
    return { result };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  del,
};
