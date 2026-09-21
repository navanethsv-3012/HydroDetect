import mongoose from 'mongoose';
import Alert from '../models/Alert.js';
import { store } from '../utils/inMemoryStore.js';

export const getAlerts = async (req, res, next) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { severity, deviceId, acknowledged, limit = 50, page = 1 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    if (isMongoConnected) {
      const filter = {};
      if (severity) filter.severity = severity;
      if (deviceId) filter.deviceId = deviceId;
      if (acknowledged !== undefined) filter.acknowledged = acknowledged === 'true';

      const [alerts, total] = await Promise.all([
        Alert.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Alert.countDocuments(filter),
      ]);

      return res.status(200).json({
        success: true,
        count: alerts.length,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        data: alerts,
      });
    }

    // Fallback store
    let filtered = [...store.alerts];
    if (severity) filtered = filtered.filter((a) => a.severity === severity);
    if (deviceId) filtered = filtered.filter((a) => a.deviceId === deviceId);
    if (acknowledged !== undefined) filtered = filtered.filter((a) => a.acknowledged === (acknowledged === 'true'));

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

export const getAlertSummary = async (req, res, next) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;

    const result = {
      Critical: { total: 0, unacknowledged: 0 },
      High: { total: 0, unacknowledged: 0 },
      Medium: { total: 0, unacknowledged: 0 },
      Low: { total: 0, unacknowledged: 0 },
    };

    if (isMongoConnected) {
      const summary = await Alert.aggregate([
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 },
            unacknowledged: {
              $sum: { $cond: [{ $eq: ['$acknowledged', false] }, 1, 0] },
            },
          },
        },
      ]);

      for (const item of summary) {
        if (result[item._id]) {
          result[item._id] = { total: item.count, unacknowledged: item.unacknowledged };
        }
      }
    } else {
      for (const alert of store.alerts) {
        if (result[alert.severity]) {
          result[alert.severity].total += 1;
          if (!alert.acknowledged) result[alert.severity].unacknowledged += 1;
        }
      }
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const acknowledgeAlert = async (req, res, next) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;
    let alert;

    if (isMongoConnected) {
      alert = await Alert.findByIdAndUpdate(
        req.params.id,
        {
          acknowledged: true,
          acknowledgedBy: req.user?.email || 'system',
          acknowledgedAt: new Date(),
        },
        { new: true }
      );
    } else {
      alert = store.alerts.find((a) => a._id === req.params.id);
      if (alert) {
        alert.acknowledged = true;
        alert.acknowledgedBy = req.user?.email || 'system';
        alert.acknowledgedAt = new Date();
      }
    }

    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found.' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('alert:updated', typeof alert.toObject === 'function' ? alert.toObject() : alert);
    }

    res.status(200).json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
};

export default { getAlerts, getAlertSummary, acknowledgeAlert };
