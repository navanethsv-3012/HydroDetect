import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: [true, 'Device ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Device name is required'],
      trim: true,
    },
    location: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    factoryName: {
      type: String,
      default: 'Default Factory',
      trim: true,
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'disconnected'],
      default: 'offline',
    },
    lastSeen: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Device = mongoose.model('Device', deviceSchema);
export default Device;
