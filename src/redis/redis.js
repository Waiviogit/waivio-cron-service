const redis = require('redis');
const util = require('util');

redis.RedisClient.prototype.get = util.promisify(redis.RedisClient.prototype.get);
redis.RedisClient.prototype.del = util.promisify(redis.RedisClient.prototype.del);
redis.RedisClient.prototype.smembers = util.promisify(redis.RedisClient.prototype.smembers);
redis.RedisClient.prototype.zrevrange = util.promisify(redis.RedisClient.prototype.zrevrange);
redis.RedisClient.prototype.expire = util.promisify(redis.RedisClient.prototype.expire);
redis.RedisClient.prototype.sadd = util.promisify(redis.RedisClient.prototype.sadd);

const db8Client = redis.createClient();

db8Client.select(8);

module.exports = {
  db8Client,
};
