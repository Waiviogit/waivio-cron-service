module.exports = (client) => ({
  get: async ({ key }) => {
    try {
      const result = await client.get(key);
      return { result };
    } catch (error) {
      return { error };
    }
  },
  smembers: async ({ key }) => {
    try {
      const result = await client.smembers(key);
      return { result };
    } catch (error) {
      return { error };
    }
  },
  zrevrange: async ({
    key, start, stop,
  }) => {
    try {
      const result = await client.zrevrange(key, start, stop);
      return { result };
    } catch (error) {
      return { error };
    }
  },
  del: async ({ key }) => {
    try {
      const result = await client.del(key);
      return { result };
    } catch (error) {
      return { error };
    }
  },
  expire: async ({ key, time }) => {
    try {
      const result = await client.expire(key, time);
      return { result };
    } catch (error) {
      return { error };
    }
  },
  sadd: async ({ key, member }) => {
    try {
      const result = await client.sadd(key, member);
      return { result };
    } catch (error) {
      return { error };
    }
  },
  hgetall: async ({ key }) => {
    try {
      const result = await client.hgetall(key);
      return { result };
    } catch (error) {
      return { error };
    }
  },
});
