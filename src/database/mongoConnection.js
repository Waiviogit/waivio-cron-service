const mongodb = require('mongodb');

const URI = process.env.MONGO_URI_WAIVIO
  ? process.env.MONGO_URI_WAIVIO
  : 'mongodb://localhost:27017';

const client = new mongodb.MongoClient(URI);

module.exports = client;
