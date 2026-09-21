import mongoose from 'mongoose';
import Device from '../models/Device.js';
import { store } from '../utils/inMemoryStore.js';

const OFFLINE_TIMEOUT_MS = 120_000; // 2 minutes

let offlineCheckInterval = null;

export const initSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`[SOCKET] Client connected: ${socket.id}`);

    socket.on('subscribe:device', (deviceId) => {
      socket.join(`device:${deviceId}`);
    });

    socket.on('unsubscribe:device', (deviceId) => {
      socket.leave(`device:${deviceId}`);
    });

    // Send current hardware session state on connect
    socket.emit('hardware:session', store.hardwareSession);

    socket.on('disconnect', (reason) => {
      console.log(`[SOCKET] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  startOfflineCheck(io);
  console.log('[SOCKET] Handlers initialized');
};

const startOfflineCheck = (io) => {
  if (offlineCheckInterval) clearInterval(offlineCheckInterval);

  offlineCheckInterval = setInterval(async () => {
    try {
      const isMongoConnected = mongoose.connection.readyState === 1;
      const cutoff = new Date(Date.now() - OFFLINE_TIMEOUT_MS);

      if (isMongoConnected) {
        const staleDevices = await Device.find({
          status: 'online',
          lastSeen: { $lt: cutoff },
        });

        for (const device of staleDevices) {
          device.status = 'offline';
          await device.save();

          io.emit('device:status', {
            deviceId: device.deviceId,
            status: 'offline',
            lastSeen: device.lastSeen,
          });

          console.log(`[SOCKET] Device ${device.deviceId} marked offline`);
        }
      } else {
        // In-memory fallback
        for (const device of store.devices) {
          if (device.status === 'online' && device.lastSeen && new Date(device.lastSeen) < cutoff) {
            device.status = 'offline';
            io.emit('device:status', {
              deviceId: device.deviceId,
              status: 'offline',
              lastSeen: device.lastSeen,
            });
          }
        }
      }
    } catch (error) {
      console.error('[SOCKET] Offline check error:', error.message);
    }
  }, 30_000);
};

export default { initSocketHandlers };
