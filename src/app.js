const http = require('http');
const dotenv = require('dotenv');
const Sentry = require('@sentry/node');

dotenv.config({ path: `env/${process.env.NODE_ENV || 'development'}.env` });

// Import connection managers
const mongoConnection = require('./database/mongoConnection');
const redisConnection = require('./redis/redis');

require('./jobs');
const { bootstrapWelcomeJob } = require('./jobs/bots/waivioWelcome');

const PORT = process.env.PORT || 9483;
const server = http.createServer();

// Global connection manager
const connectionManager = {
  async connect() {
    console.log('Initializing connection pools...');

    try {
      // Connect all services in parallel
      await Promise.all([
        mongoConnection.connect(),
        redisConnection.connect(),
      ]);

      console.log('All connection pools initialized successfully');
    } catch (error) {
      console.error('Failed to initialize connection pools:', error);
      throw error;
    }
  },

  async close() {
    console.log('Closing all connection pools...');

    try {
      // Close all services in parallel
      await Promise.all([
        mongoConnection.close(),
        redisConnection.close(),
      ]);

      console.log('All connection pools closed successfully');
    } catch (error) {
      console.error('Error closing connection pools:', error);
      throw error;
    }
  },

  async healthCheck() {
    try {
      const results = await Promise.allSettled([
        mongoConnection.healthCheck(),
        redisConnection.healthCheck(),
      ]);

      const health = {
        mongo: results[0].status === 'fulfilled' && results[0].value,
        redis: results[1].status === 'fulfilled' && results[1].value,
      };

      const allHealthy = Object.values(health).every(Boolean);

      if (!allHealthy) {
        console.warn('Health check failed:', health);
      }

      return { healthy: allHealthy, details: health };
    } catch (error) {
      console.error('Health check error:', error);
      return { healthy: false, error: error.message };
    }
  },
};

const bootstrap = async () => {
  try {
    // Initialize connection pools
    await connectionManager.connect();

    // Start HTTP server
    server.listen(PORT);
    console.log(`Server listening on port ${PORT}`);

    // Initialize Sentry
    Sentry.init({
      environment: process.env.NODE_ENV,
      dsn: process.env.SENTRY_DNS,
    });

    // Bootstrap welcome job
    await bootstrapWelcomeJob();

    console.log('Application started successfully');

    // Set up periodic health checks
    setInterval(async () => {
      await connectionManager.healthCheck();
    }, 5 * 60 * 1000); // Every 5 minutes
  } catch (error) {
    console.error('Failed to bootstrap application:', error);
    process.exit(1);
  }
};

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}, starting graceful shutdown...`);

  try {
    // Stop accepting new connections
    server.close(() => {
      console.log('HTTP server closed');
    });

    // Close all connection pools
    await connectionManager.close();

    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

bootstrap();
