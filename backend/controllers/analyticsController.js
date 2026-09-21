import mongoose from 'mongoose';
import Reading from '../models/Reading.js';
import Alert from '../models/Alert.js';
import Device from '../models/Device.js';
import { store } from '../utils/inMemoryStore.js';

export const getSummary = async (req, res, next) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      const [
        totalDevices,
        onlineDevices,
        totalReadings,
        totalAlerts,
        criticalAlerts,
        highAlerts,
        latestReadings,
      ] = await Promise.all([
        Device.countDocuments(),
        Device.countDocuments({ status: 'online' }),
        Reading.countDocuments(),
        Alert.countDocuments(),
        Alert.countDocuments({ severity: 'Critical', acknowledged: false }),
        Alert.countDocuments({ severity: 'High', acknowledged: false }),
        Reading.aggregate([
          { $sort: { timestamp: -1 } },
          { $group: { _id: '$deviceId', reading: { $first: '$$ROOT' } } },
          { $replaceRoot: { newRoot: '$reading' } },
        ]),
      ]);

      let avgPhPost = 0, avgTdsPost = 0, avgWaterLoss = 0;
      if (latestReadings.length > 0) {
        avgPhPost = latestReadings.reduce((sum, r) => sum + r.ph_post, 0) / latestReadings.length;
        avgTdsPost = latestReadings.reduce((sum, r) => sum + r.tds_post, 0) / latestReadings.length;
        avgWaterLoss = latestReadings.reduce((sum, r) => sum + r.water_loss_percent, 0) / latestReadings.length;
      }

      return res.status(200).json({
        success: true,
        data: {
          devices: { total: totalDevices, online: onlineDevices, offline: totalDevices - onlineDevices },
          readings: { total: totalReadings },
          alerts: { total: totalAlerts, critical: criticalAlerts, high: highAlerts },
          averages: {
            ph_post: parseFloat(avgPhPost.toFixed(2)),
            tds_post: parseFloat(avgTdsPost.toFixed(0)),
            water_loss_percent: parseFloat(avgWaterLoss.toFixed(2)),
          },
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Fallback store
    const totalDevices = store.devices.length;
    const onlineDevices = store.devices.filter((d) => d.status === 'online').length;
    const totalReadings = store.readings.length;
    const totalAlerts = store.alerts.length;
    const criticalAlerts = store.alerts.filter((a) => a.severity === 'Critical' && !a.acknowledged).length;
    const highAlerts = store.alerts.filter((a) => a.severity === 'High' && !a.acknowledged).length;

    // Latest per device
    const latestMap = {};
    for (let i = store.readings.length - 1; i >= 0; i--) {
      const r = store.readings[i];
      if (!latestMap[r.deviceId]) latestMap[r.deviceId] = r;
    }
    const latestReadings = Object.values(latestMap);

    let avgPhPost = 0, avgTdsPost = 0, avgWaterLoss = 0;
    if (latestReadings.length > 0) {
      avgPhPost = latestReadings.reduce((sum, r) => sum + r.ph_post, 0) / latestReadings.length;
      avgTdsPost = latestReadings.reduce((sum, r) => sum + r.tds_post, 0) / latestReadings.length;
      avgWaterLoss = latestReadings.reduce((sum, r) => sum + r.water_loss_percent, 0) / latestReadings.length;
    }

    res.status(200).json({
      success: true,
      data: {
        devices: { total: totalDevices, online: onlineDevices, offline: totalDevices - onlineDevices },
        readings: { total: totalReadings },
        alerts: { total: totalAlerts, critical: criticalAlerts, high: highAlerts },
        averages: {
          ph_post: parseFloat(avgPhPost.toFixed(2)),
          tds_post: parseFloat(avgTdsPost.toFixed(0)),
          water_loss_percent: parseFloat(avgWaterLoss.toFixed(2)),
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTrends = async (req, res, next) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { deviceId, limit = 50 } = req.query;
    const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10)));

    if (isMongoConnected) {
      const filter = {};
      if (deviceId) filter.deviceId = deviceId;
      const readings = await Reading.find(filter).sort({ timestamp: -1 }).limit(limitNum).lean();
      readings.reverse();
      return res.status(200).json({ success: true, count: readings.length, data: readings });
    }

    let filtered = [...store.readings];
    if (deviceId) filtered = filtered.filter((r) => r.deviceId === deviceId);

    const sliced = filtered.slice(-limitNum);
    res.status(200).json({ success: true, count: sliced.length, data: sliced });
  } catch (error) {
    next(error);
  }
};

export const getEfficiency = async (req, res, next) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      const efficiency = await Reading.aggregate([
        { $sort: { timestamp: -1 } },
        {
          $group: {
            _id: '$deviceId',
            avgPhPre: { $avg: '$ph_pre' },
            avgPhPost: { $avg: '$ph_post' },
            avgTdsPre: { $avg: '$tds_pre' },
            avgTdsPost: { $avg: '$tds_post' },
            avgWaterLoss: { $avg: '$water_loss_percent' },
            readingCount: { $sum: 1 },
            latestTimestamp: { $first: '$timestamp' },
          },
        },
      ]);

      const result = efficiency.map((e) => ({
        deviceId: e._id,
        phEfficiency: e.avgTdsPre > 0
          ? parseFloat((((e.avgTdsPre - e.avgTdsPost) / e.avgTdsPre) * 100).toFixed(1))
          : 0,
        avgPhPre: parseFloat(e.avgPhPre.toFixed(2)),
        avgPhPost: parseFloat(e.avgPhPost.toFixed(2)),
        avgTdsPre: parseFloat(e.avgTdsPre.toFixed(0)),
        avgTdsPost: parseFloat(e.avgTdsPost.toFixed(0)),
        avgWaterLoss: parseFloat(e.avgWaterLoss.toFixed(2)),
        readingCount: e.readingCount,
        latestTimestamp: e.latestTimestamp,
      }));

      return res.status(200).json({ success: true, data: result });
    }

    // Fallback store
    const deviceMap = {};
    for (const r of store.readings) {
      if (!deviceMap[r.deviceId]) {
        deviceMap[r.deviceId] = { count: 0, tdsPreSum: 0, tdsPostSum: 0, phPreSum: 0, phPostSum: 0, lossSum: 0, latest: r.timestamp };
      }
      const entry = deviceMap[r.deviceId];
      entry.count += 1;
      entry.tdsPreSum += r.tds_pre;
      entry.tdsPostSum += r.tds_post;
      entry.phPreSum += r.ph_pre;
      entry.phPostSum += r.ph_post;
      entry.lossSum += r.water_loss_percent;
      entry.latest = r.timestamp;
    }

    const result = Object.entries(deviceMap).map(([devId, stats]) => {
      const avgTdsPre = stats.tdsPreSum / stats.count;
      const avgTdsPost = stats.tdsPostSum / stats.count;
      const eff = avgTdsPre > 0 ? (((avgTdsPre - avgTdsPost) / avgTdsPre) * 100).toFixed(1) : 0;
      return {
        deviceId: devId,
        phEfficiency: parseFloat(eff),
        avgPhPre: parseFloat((stats.phPreSum / stats.count).toFixed(2)),
        avgPhPost: parseFloat((stats.phPostSum / stats.count).toFixed(2)),
        avgTdsPre: parseFloat(avgTdsPre.toFixed(0)),
        avgTdsPost: parseFloat(avgTdsPost.toFixed(0)),
        avgWaterLoss: parseFloat((stats.lossSum / stats.count).toFixed(2)),
        readingCount: stats.count,
        latestTimestamp: stats.latest,
      };
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export default { getSummary, getTrends, getEfficiency };
