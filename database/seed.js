import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', 'backend', '.env') });

import User from '../backend/models/User.js';

const seedAdmin = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aquasentinel';
    await mongoose.connect(uri);
    console.log('[SEED] Connected to MongoDB');

    // Check if admin exists
    const existing = await User.findOne({ email: 'admin@aquasentinel.com' });
    if (existing) {
      console.log('[SEED] Admin user already exists. Skipping.');
    } else {
      await User.create({
        name: 'Admin',
        email: 'admin@aquasentinel.com',
        passwordHash: 'admin123',
        role: 'admin',
      });
      console.log('[SEED] Admin user created: admin@aquasentinel.com / admin123');
    }

    await mongoose.disconnect();
    console.log('[SEED] Done.');
    process.exit(0);
  } catch (error) {
    console.error('[SEED] Error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
