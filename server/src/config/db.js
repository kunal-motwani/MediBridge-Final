const dns = require('dns');
const mongoose = require('mongoose');

let mongoServer;

dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;

    // Use memory server if it's the local default or if it's explicitly requested
    if (!uri || uri.includes('127.0.0.1') || uri.includes('localhost')) {
      console.log('Starting mongodb-memory-server...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      console.log(`Memory server started at ${uri}`);
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
