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
redis.RedisClient.prototype.keys = util.promisify(redis.RedisClient.prototype.keys);
redis.RedisClient.prototype.set = util.promisify(redis.RedisClient.prototype.set);

const db2Client = redis.createClient();
const db8Client = redis.createClient();
const db9Client = redis.createClient();
const db10Client = redis.createClient();
const db11Client = redis.createClient();

db2Client.select(2);
db8Client.select(8);
db9Client.select(9);
db10Client.select(10);
db11Client.select(11);

module.exports = {
  db2Client,
  db8Client,
  db9Client,
  db10Client,
  db11Client,
};
