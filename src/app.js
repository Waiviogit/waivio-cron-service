const http = require('http');
const dotenv = require('dotenv');

dotenv.config({ path: `env/${process.env.NODE_ENV || 'development'}.env` });
const client = require('./database/mongoConnection');
require('./jobs');

const PORT = process.env.PORT || 9483;
const server = http.createServer();

const bootstrap = async () => {
  await client.connect();
  console.log('mongo connected');
  server.listen(PORT);
  console.log(`listen on ${PORT}`);
};

bootstrap();
