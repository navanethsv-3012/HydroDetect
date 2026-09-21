import mongoose from 'mongoose';
import Reading from '../models/Reading.js';
import { store } from '../utils/inMemoryStore.js';

export const getReadings = async (req, res, next) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { deviceId, limit = 50, page = 1, sort = '-timestamp' } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    if (isMongoConnected) {
      const filter = {};
      if (deviceId) filter.deviceId = deviceId;

      const [readings, total] = await Promise.all([
        Reading.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Reading.countDocuments(filter),
      ]);

      return res.status(200).json({
        success: true,
        count: readings.length,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        data: readings,
      });
    }

    // Fallback store
    let filtered = [...store.readings];
    if (deviceId) filtered = filtered.filter((r) => r.deviceId === deviceId);

    // Sort
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const total = filtered.length;
    const paged = filtered.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      count: paged.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      data: paged,
    });
  } catch (error) {
    next(error);
  }
};

export const getLatestReadings = async (req, res, next) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { deviceId } = req.query;

    if (isMongoConnected) {
      if (deviceId) {
        const reading = await Reading.findOne({ deviceId }).sort({ timestamp: -1 }).lean();
        return res.status(200).json({ success: true, data: reading });
      }

      const latest = await Reading.aggregate([
        { $sort: { timestamp: -1 } },
        { $group: { _id: '$deviceId', reading: { $first: '$$ROOT' } } },
        { $replaceRoot: { newRoot: '$reading' } },
        { $sort: { deviceId: 1 } },
      ]);
      return res.status(200).json({ success: true, count: latest.length, data: latest });
    }

    // Fallback store
    if (deviceId) {
      const reading = [...store.readings].reverse().find((r) => r.deviceId === deviceId);
      return res.status(200).json({ success: true, data: reading || null });
    }

    // Group latest per device
    const latestMap = {};
    for (let i = store.readings.length - 1; i >= 0; i--) {
      const r = store.readings[i];
      if (!latestMap[r.deviceId]) {
        latestMap[r.deviceId] = r;
      }
    }
    const latest = Object.values(latestMap);
    res.status(200).json({ success: true, count: latest.length, data: latest });
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

      const readings = await Reading.find(filter)
        .sort({ timestamp: -1 })
        .limit(limitNum)
        .lean();

      readings.reverse();
      return res.status(200).json({ success: true, count: readings.length, data: readings });
    }

    // Fallback store
    let filtered = [...store.readings];
    if (deviceId) filtered = filtered.filter((r) => r.deviceId === deviceId);

    const sliced = filtered.slice(-limitNum);
    res.status(200).json({ success: true, count: sliced.length, data: sliced });
  } catch (error) {
    next(error);
  }
};

export default { getReadings, getLatestReadings, getTrends };
