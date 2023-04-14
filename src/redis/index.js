const { db8Client, db2Client } = require('./redis');

module.exports = {
  redis: require('./redis'),
  redisGetter: require('./redisGetter'),
  redisSetter: require('./redisSetter'),
  expireClient: require('./operations')(db8Client),
  lastBlockClient: require('./operations')(db2Client),
};
