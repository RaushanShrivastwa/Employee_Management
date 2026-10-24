const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

let mongodInstance = null;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB] Direct connection to ${MONGODB_URI} failed: ${error.message}`);
    console.log('[MongoDB] Launching embedded in-memory MongoDB instance for local seamless execution...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const uri = mongodInstance.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`[MongoDB] In-Memory MongoDB connected at ${uri}`);
      return conn;
    } catch (innerErr) {
      console.error(`[MongoDB] Fatal error initializing database: ${innerErr.message}`);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
