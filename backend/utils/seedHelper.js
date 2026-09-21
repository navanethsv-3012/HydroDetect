import User from '../models/User.js';

/**
 * Auto-seeds default admin account if database has zero users.
 */
export const autoSeedAdmin = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      await User.create({
        name: 'System Admin',
        email: 'admin@aquasentinel.com',
        passwordHash: 'admin123',
        role: 'admin',
      });
      console.log('[SEED] Auto-seeded default admin user: admin@aquasentinel.com (password: admin123)');
    }
  } catch (error) {
    console.error('[SEED] Auto-seed check failed:', error.message);
  }
};

export default autoSeedAdmin;
