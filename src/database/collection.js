const connection = require('./mongoConnection');

module.exports = ({ collectionName, dbName }) => {
  const db = connection.db(dbName);
  const collection = db.collection(collectionName);
  return {
    find: async ({ filter, options = {} }) => {
      try {
        const result = await collection.find(filter, options).toArray();
        return { result };
      } catch (error) {
        return { error };
      }
    },
    findOne: async ({ filter, options = {} }) => {
      try {
        const result = await collection.findOne(filter, options);
        return { result };
      } catch (error) {
        return { error };
      }
    },
  };
};
