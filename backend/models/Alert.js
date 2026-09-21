import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: [true, 'Device ID is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Alert type is required'],
      enum: ['ph_violation', 'tds_violation', 'water_bypass', 'water_loss', 'device_offline'],
      trim: true,
    },
    severity: {
      type: String,
      required: [true, 'Alert severity is required'],
      enum: ['Low', 'Medium', 'High', 'Critical'],
    },
    message: {
      type: String,
      required: [true, 'Alert message is required'],
    },
    values: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    acknowledged: {
      type: Boolean,
      default: false,
    },
    acknowledgedBy: {
      type: String,
      default: null,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

alertSchema.index({ deviceId: 1, createdAt: -1 });
alertSchema.index({ severity: 1 });

const Alert = mongoose.model('Alert', alertSchema);
export default Alert;
