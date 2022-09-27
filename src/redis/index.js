const moduleExports = {};

moduleExports.redis = require('./redis');
moduleExports.redisGetter = require('./redisGetter');

module.exports = {
  redis: require('./redis'),
  redisGetter: require('./redisGetter'),
};
