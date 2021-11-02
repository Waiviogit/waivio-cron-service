export const REDIS_EXPIRE_CLIENT = 'expirePost';
export const REDIS_KEY_VOTE_UPDATES = 'votesUpdate';
export const REDIS_KEY_CHILDREN_UPDATE = 'commentsCounterUpdate';

export const MONGODB_WAIVIO_CONNECTION = 'MONGODB_WAIVIO_CONNECTION';

const COMMON_NODES = [
  'https://anyx.io',
  'https://api.hive.blog',
  'https://api.openhive.network',
  'https://rpc.ausbit.dev',
  'https://rpc.ecency.com',
  'https://hive-api.arcange.eu',
];

export const RPC_NODES_HIVEMIND = [
  'https://blocks.waivio.com:8082',
  ...COMMON_NODES,
];

export const RPC_NODES_HIVED = [
  'https://blocks.waivio.com',
  ...COMMON_NODES,
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

export const VOTE_FIELDS = ['voter', 'percent', 'rshares', 'rsharesWAIV'];

export const REDIS_KEY_DISTRIBUTE_HIVE_ENGINE_REWARD = 'distributeHiveEngineReward';

export const TOKEN_WAIV = {
  SYMBOL: 'WAIV',
  POOL_ID: 13,
  DIESEL_POOL_ID: 63,
  WELCOME_USD_FILTER: 50,
  EXPERTISE_FIELD: 'expertiseWAIV',
  WELCOME_REDIS: `welcome${this.SYMBOL}`,
  TAGS: ['waivio', 'neoxian', 'palnet'],
};

export const DAILY_WEIGHT = 100000;
