const http = require('http');
const client = require('./database/mongoConnection');
require('./jobs');

const PORT = 9483;

const bootstrap = async () => {
  await client.connect();
  console.log('mongo connected');
  http.createServer().listen(PORT);
  console.log(`listen on ${PORT}`);
};

bootstrap();
