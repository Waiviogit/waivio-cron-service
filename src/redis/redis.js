const Redis = require('ioredis');

// Redis connection pool configuration
const redisConfig = {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxLoadingTimeout: 10000,
  lazyConnect: true,
  keepAlive: 30000,
  family: 4, // IPv4
  connectTimeout: 10000,
  commandTimeout: 5000,
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
};

// Create Redis clients with connection pooling
const createRedisClient = (db) => new Redis({
  ...redisConfig,
  db,
});

// Initialize Redis clients
const db2Client = createRedisClient(2);
const db8Client = createRedisClient(8);
const db9Client = createRedisClient(9);
const db10Client = createRedisClient(10);
const db11Client = createRedisClient(11);

// Connection state tracking
const clients = [db2Client, db8Client, db9Client, db10Client, db11Client];
let isConnected = false;

// Health check function
const healthCheck = async () => {
  try {
    await Promise.all(clients.map((client) => client.ping()));
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
};

// Initialize Redis clients
const connect = async () => {
  if (isConnected) return;

  try {
    // Test connection with a ping to ensure clients are ready
    await healthCheck();
    isConnected = true;
    console.log('Redis connections established with pooling');

    // Set up error handlers
    clients.forEach((client, index) => {
      client.on('error', (error) => {
        console.error(`Redis client ${index} error:`, error);
      });

      client.on('connect', () => {
        console.log(`Redis client ${index} connected`);
      });

      client.on('close', () => {
        console.log(`Redis client ${index} disconnected`);
      });

      client.on('ready', () => {
        console.log(`Redis client ${index} ready`);
      });
    });
  } catch (error) {
    console.error('Failed to connect Redis clients:', error);
    throw error;
  }
};

// Close all Redis connections
const close = async () => {
  if (!isConnected) return;

  try {
    await Promise.all(clients.map((client) => client.disconnect()));
    isConnected = false;
    console.log('All Redis connections closed');
  } catch (error) {
    console.error('Error closing Redis connections:', error);
    throw error;
  }
};

// Get client by database number
const getClient = (dbNumber) => {
  const clientMap = {
    2: db2Client,
    8: db8Client,
    9: db9Client,
    10: db10Client,
    11: db11Client,
  };
  return clientMap[dbNumber];
};

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing Redis connections...');
  await close();
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing Redis connections...');
  await close();
});

module.exports = {
  db2Client,
  db8Client,
  db9Client,
  db10Client,
  db11Client,
  connect,
  close,
  healthCheck,
  getClient,
  isConnected: () => isConnected,
};
