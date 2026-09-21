import mongoose from 'mongoose';
import { ingestReading } from '../services/ingestionService.js';
import Device from '../models/Device.js';
import { store } from '../utils/inMemoryStore.js';

class Simulator {
  constructor() {
    this.intervalId = null;
    this.io = null;
    this.isRunning = false;
    this.tickCount = {};
    this.flowAccumulator = {};
    this.devices = [];
  }

  async initDevices() {
    // Single hardware unit only
    const deviceDefs = [
      {
        deviceId: 'ESP-DYE-001',
        name: 'Main Effluent Monitoring Station',
        location: 'Treatment Plant — Primary Outlet',
        factoryName: 'HydroDetect Industries',
      },
    ];

    this.devices = deviceDefs;
    const isMongoConnected = mongoose.connection.readyState === 1;

    for (const def of this.devices) {
      if (isMongoConnected) {
        await Device.findOneAndUpdate(
          { deviceId: def.deviceId },
          { ...def, status: 'online', lastSeen: new Date() },
          { upsert: true, new: true }
        );
      } else {
        const existing = store.devices.find((d) => d.deviceId === def.deviceId);
        if (existing) {
          existing.status = 'online';
          existing.lastSeen = new Date();
        } else {
          store.devices.push({ ...def, status: 'online', lastSeen: new Date() });
        }
      }
      this.tickCount[def.deviceId] = 0;
      this.flowAccumulator[def.deviceId] = 1000 + Math.random() * 5000;
    }

    // Update hardware session
    store.hardwareSession.startedAt = new Date();
    store.hardwareSession.packetsReceived = 0;

    console.log(`[SIMULATOR] Initialized ${this.devices.length} device (${isMongoConnected ? 'MongoDB' : 'In-Memory'})`);
  }

  async start(io) {
    if (this.isRunning) {
      console.warn('[SIMULATOR] Already running.');
      return;
    }

    this.io = io;
    await this.initDevices();

    const interval = parseInt(process.env.SIMULATOR_INTERVAL_MS, 10) || 5000;

    this.intervalId = setInterval(() => {
      this.tick();
    }, interval);

    this.isRunning = true;
    console.log(`[SIMULATOR] Started — emitting every ${interval}ms for ESP-DYE-001`);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[SIMULATOR] Stopped.');
  }

  async tick() {
    for (const device of this.devices) {
      try {
        this.tickCount[device.deviceId] = (this.tickCount[device.deviceId] || 0) + 1;
        const tick = this.tickCount[device.deviceId];
        const isAnomalyTick = tick % 12 === 0; // Every 12th tick (~60 seconds)

        const payload = this.generateReading(device.deviceId, isAnomalyTick);
        await ingestReading(device.deviceId, payload, this.io);

        // Update hardware session tracking
        store.hardwareSession.packetsReceived++;
        store.hardwareSession.lastPacketAt = new Date();

        // Broadcast hardware session update
        if (this.io) {
          this.io.emit('hardware:packet', {
            deviceId: device.deviceId,
            tick,
            timestamp: new Date().toISOString(),
            payload,
            session: store.hardwareSession,
          });
        }

        if (isAnomalyTick) {
          const loss = ((payload.flow_inlet - payload.flow_outlet) / payload.flow_inlet * 100).toFixed(1);
          console.log(`[SIMULATOR] 🚨 Anomaly tick #${tick} on ${device.deviceId} — water_loss: ${loss}%`);
        }
      } catch (error) {
        store.hardwareSession.errors++;
        console.error(`[SIMULATOR] Error for ${device.deviceId}: ${error.message}`);
      }
    }
  }

  generateReading(deviceId, forceAnomaly = false) {
    const ph_pre = this.randomInRange(4.0, 9.5);
    let ph_post = this.randomInRange(6.5, 8.4);

    const tds_pre = this.randomInRange(800, 2500);
    let tds_post = this.randomInRange(200, 480);

    const flowIncrement = this.randomInRange(50, 200);
    this.flowAccumulator[deviceId] = (this.flowAccumulator[deviceId] || 1000) + flowIncrement;
    const flow_inlet = parseFloat(this.flowAccumulator[deviceId].toFixed(2));

    let flow_outlet;
    if (forceAnomaly) {
      const lossPercent = this.randomInRange(16, 28) / 100;
      flow_outlet = parseFloat((flow_inlet * (1 - lossPercent)).toFixed(2));

      if (Math.random() > 0.5) ph_post = this.randomInRange(8.6, 10.0);
      if (Math.random() > 0.5) tds_post = this.randomInRange(510, 750);
    } else {
      const normalLoss = this.randomInRange(0, 6) / 100;
      flow_outlet = parseFloat((flow_inlet * (1 - normalLoss)).toFixed(2));
    }

    return {
      ph_pre: parseFloat(ph_pre.toFixed(2)),
      ph_post: parseFloat(ph_post.toFixed(2)),
      tds_pre: parseFloat(tds_pre.toFixed(0)),
      tds_post: parseFloat(tds_post.toFixed(0)),
      flow_inlet,
      flow_outlet,
    };
  }

  randomInRange(min, max) {
    return min + Math.random() * (max - min);
  }
}

const simulator = new Simulator();
export default simulator;
