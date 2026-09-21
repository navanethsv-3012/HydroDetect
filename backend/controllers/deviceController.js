import mongoose from 'mongoose';
import Device from '../models/Device.js';
import { store } from '../utils/inMemoryStore.js';

export const getDevices = async (req, res, next) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;
    let devices;

    if (isMongoConnected) {
      const { status } = req.query;
      const filter = {};
      if (status) filter.status = status;
      devices = await Device.find(filter).sort({ createdAt: -1 }).lean();
    } else {
      devices = store.devices;
      if (req.query.status) {
        devices = devices.filter((d) => d.status === req.query.status);
      }
    }

    res.status(200).json({
      success: true,
      count: devices.length,
      data: devices,
    });
  } catch (error) {
    next(error);
  }
};

export const getDevice = async (req, res, next) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;
    let device;

    if (isMongoConnected) {
      device = await Device.findOne({ deviceId: req.params.id }).lean();
    } else {
      device = store.devices.find((d) => d.deviceId === req.params.id);
    }

    if (!device) {
      return res.status(404).json({
        success: false,
        error: `Device '${req.params.id}' not found.`,
      });
    }

    res.status(200).json({
      success: true,
      data: device,
    });
  } catch (error) {
    next(error);
  }
};

export const createDevice = async (req, res, next) => {
  try {
    const { deviceId, name, location, factoryName } = req.body;
    const isMongoConnected = mongoose.connection.readyState === 1;

    let device;
    if (isMongoConnected) {
      device = await Device.create({ deviceId, name, location, factoryName });
    } else {
      device = { deviceId, name, location, factoryName: factoryName || 'Default Factory', status: 'online', lastSeen: new Date() };
      store.devices.push(device);
    }

    res.status(201).json({
      success: true,
      data: device,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDevice = async (req, res, next) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;
    let device;

    if (isMongoConnected) {
      device = await Device.findOneAndUpdate(
        { deviceId: req.params.id },
        req.body,
        { new: true, runValidators: true }
      );
    } else {
      const idx = store.devices.findIndex((d) => d.deviceId === req.params.id);
      if (idx >= 0) {
        store.devices[idx] = { ...store.devices[idx], ...req.body };
        device = store.devices[idx];
      }
    }

    if (!device) {
      return res.status(404).json({
        success: false,
        error: `Device '${req.params.id}' not found.`,
      });
    }

    res.status(200).json({
      success: true,
      data: device,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDevice = async (req, res, next) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;
    let deleted = false;

    if (isMongoConnected) {
      const device = await Device.findOneAndDelete({ deviceId: req.params.id });
      deleted = !!device;
    } else {
      const idx = store.devices.findIndex((d) => d.deviceId === req.params.id);
      if (idx >= 0) {
        store.devices.splice(idx, 1);
        deleted = true;
      }
    }

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: `Device '${req.params.id}' not found.`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Device '${req.params.id}' deleted.`,
    });
  } catch (error) {
    next(error);
  }
};

export default { getDevices, getDevice, createDevice, updateDevice, deleteDevice };
