const {
  db8Client, db2Client, db10Client, db11Client, db9Client,
} = require('./redis');

module.exports = {
  redis: require('./redis'),
  redisGetter: require('./redisGetter'),
  redisSetter: require('./redisSetter'),
  redis2: require('./operations')(db2Client),
  redis8: require('./operations')(db8Client),
  redis9: require('./operations')(db9Client),
  redis10: require('./operations')(db10Client),
  redis11: require('./operations')(db11Client),
};
