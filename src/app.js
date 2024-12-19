const http = require('http');
const dotenv = require('dotenv');
const Sentry = require('@sentry/node');

dotenv.config({ path: `env/${process.env.NODE_ENV || 'development'}.env` });
const client = require('./database/mongoConnection');
require('./jobs');
const { bootstrapWelcomeJob } = require('./jobs/bots/waivioWelcome');

const PORT = process.env.PORT || 9483;
const server = http.createServer();

const bootstrap = async () => {
  await client.connect();
  console.log('mongo connected');
  server.listen(PORT);
  Sentry.init({
    environment: process.env.NODE_ENV,
    dsn: process.env.SENTRY_DNS,
  });
  console.log(`listen on ${PORT}`);
  await bootstrapWelcomeJob();
};

bootstrap();
