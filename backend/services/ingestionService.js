import mongoose from 'mongoose';
import Reading from '../models/Reading.js';
import Device from '../models/Device.js';
import Alert from '../models/Alert.js';
import { evaluateAlerts } from './alertService.js';
import { store } from '../utils/inMemoryStore.js';

export const ingestReading = async (deviceId, payload, io) => {
  const isMongoConnected = mongoose.connection.readyState === 1;

  // ─── Compute Deltas ──────────────────────────────────────
  const ph_delta = parseFloat((payload.ph_pre - payload.ph_post).toFixed(2));
  const tds_delta = parseFloat((payload.tds_pre - payload.tds_post).toFixed(2));
  const water_loss = parseFloat((payload.flow_inlet - payload.flow_outlet).toFixed(2));
  const water_loss_percent = payload.flow_inlet > 0
    ? parseFloat(((water_loss / payload.flow_inlet) * 100).toFixed(2))
    : 0;

  const readingObj = {
    _id: isMongoConnected ? undefined : `rdg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    deviceId,
    timestamp: new Date(),
    ph_pre: payload.ph_pre,
    ph_post: payload.ph_post,
    tds_pre: payload.tds_pre,
    tds_post: payload.tds_post,
    flow_inlet: payload.flow_inlet,
    flow_outlet: payload.flow_outlet,
    ph_delta,
    tds_delta,
    water_loss,
    water_loss_percent,
  };

  let reading;
  if (isMongoConnected) {
    reading = await Reading.create(readingObj);
    await Device.findOneAndUpdate(
      { deviceId },
      { status: 'online', lastSeen: new Date() },
      { upsert: true, new: true }
    );
  } else {
    reading = readingObj;
    store.readings.push(readingObj);
    if (store.readings.length > 2000) store.readings.shift(); // Keep memory bounded

    const dev = store.devices.find((d) => d.deviceId === deviceId);
    if (dev) {
      dev.status = 'online';
      dev.lastSeen = new Date();
    } else {
      store.devices.push({ deviceId, name: deviceId, location: 'Unknown', factoryName: 'Default Factory', status: 'online', lastSeen: new Date() });
    }
  }

  // ─── Evaluate Alert Rules ────────────────────────────────
  const alerts = await evaluateAlerts(deviceId, reading, io);

  // ─── Broadcast via Socket.IO ─────────────────────────────
  if (io) {
    const data = typeof reading.toObject === 'function' ? reading.toObject() : reading;
    io.emit('reading:new', data);
    io.to(`device:${deviceId}`).emit('reading:new', data);

    const stats = await getQuickStats();
    io.emit('stats:update', stats);
  }

  return { reading, alerts };
};

export const getQuickStats = async () => {
  const isMongoConnected = mongoose.connection.readyState === 1;

  if (isMongoConnected) {
    const [
      totalDevices,
      onlineDevices,
      totalReadings,
      totalAlerts,
      criticalAlerts,
      latestReading,
    ] = await Promise.all([
      Device.countDocuments(),
      Device.countDocuments({ status: 'online' }),
      Reading.countDocuments(),
      Alert.countDocuments(),
      Alert.countDocuments({ severity: 'Critical', acknowledged: false }),
      Reading.findOne().sort({ timestamp: -1 }).lean(),
    ]);

    return {
      totalDevices,
      onlineDevices,
      offlineDevices: totalDevices - onlineDevices,
      totalReadings,
      totalAlerts,
      criticalAlerts,
      latestReading,
      timestamp: new Date().toISOString(),
    };
  }

  // In-Memory Fallback Stats
  const totalDevices = store.devices.length;
  const onlineDevices = store.devices.filter((d) => d.status === 'online').length;
  const totalReadings = store.readings.length;
  const totalAlerts = store.alerts.length;
  const criticalAlerts = store.alerts.filter((a) => a.severity === 'Critical' && !a.acknowledged).length;
  const latestReading = store.readings[store.readings.length - 1] || null;

  return {
    totalDevices,
    onlineDevices,
    offlineDevices: totalDevices - onlineDevices,
    totalReadings,
    totalAlerts,
    criticalAlerts,
    latestReading,
    timestamp: new Date().toISOString(),
  };
};

export default { ingestReading, getQuickStats };
