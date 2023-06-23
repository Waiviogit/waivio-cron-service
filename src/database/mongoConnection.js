const mongodb = require('mongodb');

const url = 'mongodb://localhost:27017';
const client = new mongodb.MongoClient(url);

module.exports = client;
