import mongoose from 'mongoose';
import { autoSeedIfEmpty } from './autoSeed.js';

let memoryServerInstance = null;

export async function connectDB() {
  const configuredUri = process.env.MONGO_URI;
  const isPlaceholderUri = !configuredUri || configuredUri.includes('<username>') || configuredUri.includes('cluster.mongodb.net');

  if (!isPlaceholderUri) {
    try {
      console.log('[Database] Connecting to configured MongoDB deployment...');
      const conn = await mongoose.connect(configuredUri, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
      await autoSeedIfEmpty();
      return conn;
    } catch (err) {
      console.warn(`[Database] Could not connect to configured MongoDB (${err.message}). Starting local in-memory fallback...`);
    }
  } else {
    console.log('[Database] MONGO_URI is unset or using a placeholder. Initializing local in-memory database...');
  }

  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServerInstance = await MongoMemoryServer.create();
    const uri = memoryServerInstance.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`[Database] In-Memory MongoDB connected successfully (${uri})`);
    await autoSeedIfEmpty();
    return conn;
  } catch (memErr) {
    console.error(`[Database] Failed to start in-memory MongoDB: ${memErr.message}`);
    throw memErr;
  }
}
