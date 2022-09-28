const { db8Client } = require('./redis');

module.exports = {
  redis: require('./redis'),
  redisGetter: require('./redisGetter'),
  redisSetter: require('./redisSetter'),
  expireClient: require('./operations')(db8Client),
};
