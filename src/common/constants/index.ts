export const REDIS_EXPIRE_CLIENT = 'expirePost';
export const REDIS_KEY_VOTE_UPDATES = 'votesUpdate';
export const REDIS_KEY_CHILDREN_UPDATE = 'commentsCounterUpdate';

export const MONGODB_WAIVIO_CONNECTION = 'MONGODB_WAIVIO_CONNECTION';

export const RPC_NODES_HIVEMIND = [
  // 'https://blocks.waivio.com:8082',
  'https://anyx.io',
  'https://api.hive.blog',
  'https://api.openhive.network',
  'https://rpc.ausbit.dev',
  'https://rpc.ecency.com',
  'https://hive-api.arcange.eu',
];

export const RPC_NODES_HIVE_ENGINE = [
  'https://api.hive-engine.com/rpc',
];

export const HIVEMIND_NODE_DEFAULT = 'https://blocks.waivio.com:8082';

export const ENSURE_VALUES = [
  'MONGO_HOST',
  'MONGO_PORT',
  'WAIVIO_DB',
  'REDIS_HOST',
  'REDIS_PORT',
  'REDIS_DB_EXPIRE',
];

export const REDIS_KEY_DISTRIBUTE_HIVE_ENGINE_REWARD = 'distributeHiveEngineReward';
export const REDIS_KEY_REWARDED_AUTHORS = 'rewardedAuthors';

export const HIVE_ENGINE_TOKENS = {
  WAIV: 'WAIV',
};

export const HIVE_ENGINE_TOKEN_PRICE = {
  WAIV: 0.1,
};
