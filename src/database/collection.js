const { client } = require('./mongoConnection');

module.exports = ({ collectionName, dbName }) => {
  const getCollection = () => {
    if (!client) {
      throw new Error('MongoDB client not initialized');
    }
    const db = client.db(dbName);
    return db.collection(collectionName);
  };

  return {
    find: async ({ filter, options = {} }) => {
      try {
        const collection = getCollection();
        const result = await collection.find(filter, options).toArray();
        return { result };
      } catch (error) {
        console.error('MongoDB find error:', error);
        return { error };
      }
    },
    findOne: async ({ filter, options = {} }) => {
      try {
        const collection = getCollection();
        const result = await collection.findOne(filter, options);
        return { result };
      } catch (error) {
        console.error('MongoDB findOne error:', error);
        return { error };
      }
    },
    updateOne: async ({ filter, update, options = {} }) => {
      try {
        const collection = getCollection();
        const result = await collection.updateOne(filter, update, options);
        return { result };
      } catch (error) {
        console.error('MongoDB updateOne error:', error);
        return { error };
      }
    },
    updateMany: async ({ filter, update, options = {} }) => {
      try {
        const collection = getCollection();
        const result = await collection.updateMany(filter, update, options);
        return { result };
      } catch (error) {
        console.error('MongoDB updateMany error:', error);
        return { error };
      }
    },
    aggregate: async ({ pipeline }) => {
      try {
        const collection = getCollection();
        const result = await collection.aggregate(pipeline).toArray();
        return { result };
      } catch (error) {
        console.error('MongoDB aggregate error:', error);
        return { error };
      }
    },
    count: async ({ filter, options = {} }) => {
      try {
        const collection = getCollection();
        const result = await collection.count(filter, options);
        return { result };
      } catch (error) {
        console.error('MongoDB count error:', error);
        return { error };
      }
    },
    deleteMany: async ({ filter, options = {} }) => {
      try {
        const collection = getCollection();
        const result = await collection.deleteMany(filter, options);
        return { result };
      } catch (error) {
        console.error('MongoDB deleteMany error:', error);
        return { error };
      }
    },
    insertOne: async ({ doc, options = {} }) => {
      try {
        const collection = getCollection();
        const result = await collection.insertOne(doc, options);
        return { result };
      } catch (error) {
        console.error('MongoDB insertOne error:', error);
        return { error };
      }
    },
    insertMany: async ({ docs, options = {} }) => {
      try {
        const collection = getCollection();
        const result = await collection.insertMany(docs, options);
        return { result };
      } catch (error) {
        console.error('MongoDB insertMany error:', error);
        return { error };
      }
    },
    deleteOne: async ({ filter, options = {} }) => {
      try {
        const collection = getCollection();
        const result = await collection.deleteOne(filter, options);
        return { result };
      } catch (error) {
        console.error('MongoDB deleteOne error:', error);
        return { error };
      }
    },
    replaceOne: async ({ filter, replacement, options = {} }) => {
      try {
        const collection = getCollection();
        const result = await collection.replaceOne(filter, replacement, options);
        return { result };
      } catch (error) {
        console.error('MongoDB replaceOne error:', error);
        return { error };
      }
    },
    distinct: async ({ key, filter = {} }) => {
      try {
        const collection = getCollection();
        const result = await collection.distinct(key, filter);
        return { result };
      } catch (error) {
        console.error('MongoDB distinct error:', error);
        return { error };
      }
    },
  };
};
