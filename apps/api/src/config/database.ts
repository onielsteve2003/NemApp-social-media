import mongoose from 'mongoose';
import { env } from './env.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

export async function connectDatabase() {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(env.mongodbUri, {
        dbName: env.mongodbName,
        serverSelectionTimeoutMS: 8000,
        // Force IPv4 – avoids ESERVFAIL on Windows after fresh boot
        family: 4,
      });
      console.log(`📦 MongoDB connected (${env.mongodbName})`);
      return;
    } catch (error) {
      lastError = error;
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️  MongoDB attempt ${attempt}/${MAX_RETRIES} failed: ${msg}`);
      if (attempt < MAX_RETRIES) {
        console.warn(`   ⏳ Retrying in ${RETRY_DELAY_MS / 1000}s…`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  console.warn(`⚠️  MongoDB connection failed after ${MAX_RETRIES} attempts. Running in in-memory mode.`);
  console.warn(`   Error: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
  console.warn(`   📋 Tip: DNS may not have settled yet – wait a few seconds and restart the server.`);
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
