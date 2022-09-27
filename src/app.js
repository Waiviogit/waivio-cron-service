const http = require('http');
const client = require('./database/mongoConnection');
require('./jobs');

const PORT = 9483;
const server = http.createServer();

const bootstrap = async () => {
  await client.connect();
  console.log('mongo connected');
  server.listen(PORT);
  console.log(`listen on ${PORT}`);
};

bootstrap();
