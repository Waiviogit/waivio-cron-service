module.exports = (client) => ({
  get: async ({ key }) => {
    try {
      const result = await client.get(key);
      return { result };
    } catch (error) {
      return { error };
    }
  },
  set: async ({ key, data }) => {
    try {
      const result = await client.set(key, data);
      return { result };
    } catch (error) {
      return { error };
    }
  },
  setWithMode: async ({ key, data, mode = '' }) => {
    try {
      const result = await client.set(key, data, mode);
      return { result };
    } catch (error) {
      return { error };
    }
  },
  keys: async ({ key }) => {
    try {
      const result = await client.keys(key);
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
  sismember: async ({ key, member }) => {
    try {
      const result = await client.sismember(key, member);
      return { result: !!result };
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
  hmset: async ({ key, data }) => {
    try {
      const result = await client.hmset(key, data);
      return { result };
    } catch (error) {
      return { error };
    }
  },
  incr: async ({ key }) => {
    try {
      const result = await client.incr(key);
      return { result };
    } catch (error) {
      return { error };
    }
  },
  rpush: async ({ key, elements }) => {
    try {
      const result = await client.rpush(key, elements);
      return { result };
    } catch (error) {
      return { error };
    }
  },
  llen: async ({ key }) => {
    try {
      const result = await client.llen(key);
      return { result };
    } catch (error) {
      return { error };
    }
  },
  lpop: async ({ key }) => {
    try {
      const result = await client.lpop(key);
      return { result };
    } catch (error) {
      return { error };
    }
  },
});
