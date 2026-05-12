import mongoose from 'mongoose';
import { env } from './env';

export async function connectDatabase() {
  try {
    await mongoose.connect(env.mongodbUri, {
      dbName: env.mongodbName,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`📦 MongoDB connected (${env.mongodbName})`);
  } catch (error) {
    console.warn(`⚠️  MongoDB connection failed. Running in in-memory mode.`);
    console.warn(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    console.warn(`   📋 Solution: Check firewall or MongoDB Atlas IP whitelist.`);
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
