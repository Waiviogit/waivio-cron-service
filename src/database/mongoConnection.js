const mongodb = require('mongodb');

const URI = process.env.MONGO_URI_WAIVIO
  ? process.env.MONGO_URI_WAIVIO
  : 'mongodb://localhost:27017';

// Connection pool configuration
const options = {
  maxPoolSize: 20, // Maximum number of connections in the pool
  minPoolSize: 2, // Minimum number of connections in the pool
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
  socketTimeoutMS: 45000, // Socket timeout
  connectTimeoutMS: 10000, // Connection timeout
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 10000, // How often to check connection health
  maxConnecting: 2, // Maximum number of connections being established
};

const client = new mongodb.MongoClient(URI, options);

// Connection state tracking
let isConnected = false;
let connectionPromise = null;

const connect = async () => {
  if (isConnected) return client;

  if (connectionPromise) return connectionPromise;

  connectionPromise = client.connect()
    .then(() => {
      isConnected = true;
      console.log('MongoDB connected with connection pooling');
      return client;
    })
    .catch((error) => {
      isConnected = false;
      connectionPromise = null;
      console.error('MongoDB connection failed:', error);
      throw error;
    });

  return connectionPromise;
};

const close = async () => {
  if (!isConnected) return;

  try {
    await client.close();
    isConnected = false;
    connectionPromise = null;
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    throw error;
  }
};

const healthCheck = async () => {
  if (!isConnected) return false;

  try {
    // Test connection with a simple command
    await client.db('admin').command({ ping: 1 });
    return true;
  } catch (error) {
    console.error('MongoDB health check failed:', error);
    return false;
  }
};

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing MongoDB connection...');
  await close();
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing MongoDB connection...');
  await close();
});

module.exports = {
  client,
  connect,
  close,
  healthCheck,
  isConnected: () => isConnected,
};
