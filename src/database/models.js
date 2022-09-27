const collection = require('./collection');
const { DATABASE, COLLECTION } = require('../constants/database');

module.exports = {
  postsModel: collection({ collectionName: COLLECTION.POSTS, dbName: DATABASE.WAIVIO }),
};
