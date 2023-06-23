const redis = require('redis');
const util = require('util');

redis.RedisClient.prototype.get = util.promisify(redis.RedisClient.prototype.get);
redis.RedisClient.prototype.del = util.promisify(redis.RedisClient.prototype.del);
redis.RedisClient.prototype.smembers = util.promisify(redis.RedisClient.prototype.smembers);
redis.RedisClient.prototype.zrevrange = util.promisify(redis.RedisClient.prototype.zrevrange);
redis.RedisClient.prototype.expire = util.promisify(redis.RedisClient.prototype.expire);
redis.RedisClient.prototype.sadd = util.promisify(redis.RedisClient.prototype.sadd);
redis.RedisClient.prototype.hgetall = util.promisify(redis.RedisClient.prototype.hgetall);
redis.RedisClient.prototype.hmset = util.promisify(redis.RedisClient.prototype.hmset);

const db8Client = redis.createClient();
const db2Client = redis.createClient();

db8Client.select(8);
db2Client.select(2);

module.exports = {
  db8Client,
  db2Client,
};
