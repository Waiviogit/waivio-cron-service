const collection = require('./collection');
const { DATABASE, COLLECTION } = require('../constants/database');

module.exports = {
  postModel: collection({ collectionName: COLLECTION.POSTS, dbName: DATABASE.WAIVIO }),
  userModel: collection({ collectionName: COLLECTION.USERS, dbName: DATABASE.WAIVIO }),
  appModel: collection({ collectionName: COLLECTION.APPS, dbName: DATABASE.WAIVIO }),
  userWobjectsModel: collection({ collectionName: COLLECTION.USER_WOBJECTS, dbName: DATABASE.WAIVIO }),
};
