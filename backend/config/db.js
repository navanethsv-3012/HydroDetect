import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { autoSeedAdmin } from '../utils/seedHelper.js';

dotenv.config();

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aquasentinel';
  
  try {
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[DB] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    await autoSeedAdmin();
    return conn;
  } catch (primaryErr) {
    console.warn(`[DB] Primary MongoDB connection failed (${primaryUri}): ${primaryErr.message}`);

    // If primary URI was remote/Atlas, try local fallback
    if (primaryUri.includes('mongodb+srv') || !primaryUri.includes('127.0.0.1')) {
      try {
        console.log('[DB] Attempting local MongoDB connection (127.0.0.1:27017)...');
        const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/aquasentinel', {
          serverSelectionTimeoutMS: 1500,
        });
        console.log(`[DB] Local MongoDB connected: ${localConn.connection.host}/${localConn.connection.name}`);
        await autoSeedAdmin();
        return localConn;
      } catch (localErr) {
        console.warn(`[DB] Local MongoDB connection failed: ${localErr.message}`);
      }
    }

    // Disable command buffering when operating in in-memory mode
    mongoose.set('bufferCommands', false);
    console.warn('[DB] Operating in In-Memory Mode (Zero-Dependency). Default Admin: admin@aquasentinel.com / admin123');
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export default connectDB;
