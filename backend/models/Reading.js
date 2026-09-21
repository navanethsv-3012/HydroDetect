import mongoose from 'mongoose';

const readingSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: [true, 'Device ID is required'],
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // Pre-purification (inlet) values
    ph_pre: {
      type: Number,
      required: [true, 'pH pre-treatment is required'],
    },
    // Post-purification (outlet) values
    ph_post: {
      type: Number,
      required: [true, 'pH post-treatment is required'],
    },
    tds_pre: {
      type: Number,
      required: [true, 'TDS pre-treatment is required'],
    },
    tds_post: {
      type: Number,
      required: [true, 'TDS post-treatment is required'],
    },
    // Flow values (liters)
    flow_inlet: {
      type: Number,
      required: [true, 'Flow inlet is required'],
    },
    flow_outlet: {
      type: Number,
      required: [true, 'Flow outlet is required'],
    },
    // Computed fields (set server-side by ingestion service)
    ph_delta: {
      type: Number,
      default: 0,
    },
    tds_delta: {
      type: Number,
      default: 0,
    },
    water_loss: {
      type: Number,
      default: 0,
    },
    water_loss_percent: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying by device + time range
readingSchema.index({ deviceId: 1, timestamp: -1 });

const Reading = mongoose.model('Reading', readingSchema);
export default Reading;
