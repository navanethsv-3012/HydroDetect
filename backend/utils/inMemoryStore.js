import bcrypt from 'bcryptjs';

/**
 * In-Memory Store for Zero-Dependency / Standalone Execution
 * Used as a fallback when MongoDB is not connected.
 * Single hardware unit: ESP-DYE-001 (Main Effluent Station)
 */

export const store = {
  users: [
    {
      _id: 'usr-admin-001',
      name: 'System Admin',
      email: 'admin@aquasentinel.com',
      passwordHash: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      createdAt: new Date(),
    },
  ],
  devices: [
    {
      deviceId: 'ESP-DYE-001',
      name: 'Main Effluent Monitoring Station',
      location: 'Treatment Plant — Primary Outlet',
      factoryName: 'HydroDetect Industries',
      status: 'online',
      lastSeen: new Date(),
    },
  ],
  readings: [],
  alerts: [],
  // Hardware session tracking
  hardwareSession: {
    mode: 'simulator',        // 'simulator' | 'serial'
    port: 'Virtual (Sim)',
    baudRate: 115200,
    packetsReceived: 0,
    lastPacketAt: null,
    startedAt: new Date(),
    errors: 0,
  },
};

export default store;
