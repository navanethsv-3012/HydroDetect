import mongoose from 'mongoose';
import Reading from '../models/Reading.js';
import Alert from '../models/Alert.js';
import PDFDocument from 'pdfkit';
import { store } from '../utils/inMemoryStore.js';

/**
 * Report Service — generates PDF and CSV reports.
 * Supports both MongoDB and in-memory fallback.
 */

const getDateRange = (period) => {
  const now = new Date();
  const from = new Date();

  switch (period) {
    case 'daily':
      from.setDate(now.getDate() - 1);
      break;
    case 'weekly':
      from.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      from.setMonth(now.getMonth() - 1);
      break;
    default:
      from.setDate(now.getDate() - 1);
  }

  return { from, to: now };
};

/**
 * Fetch report data for a given period.
 * Falls back to in-memory store if MongoDB is disconnected.
 */
export const getReportData = async (period) => {
  const { from, to } = getDateRange(period);
  const isMongoConnected = mongoose.connection.readyState === 1;

  let readings, alerts;

  if (isMongoConnected) {
    [readings, alerts] = await Promise.all([
      Reading.find({ timestamp: { $gte: from, $lte: to } })
        .sort({ timestamp: -1 })
        .lean(),
      Alert.find({ createdAt: { $gte: from, $lte: to } })
        .sort({ createdAt: -1 })
        .lean(),
    ]);
  } else {
    // In-memory fallback
    readings = store.readings.filter((r) => {
      const ts = new Date(r.timestamp);
      return ts >= from && ts <= to;
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    alerts = store.alerts.filter((a) => {
      const ts = new Date(a.createdAt);
      return ts >= from && ts <= to;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Compute summary stats
  const stats = {
    period,
    from: from.toISOString(),
    to: to.toISOString(),
    totalReadings: readings.length,
    totalAlerts: alerts.length,
    criticalAlerts: alerts.filter((a) => a.severity === 'Critical').length,
    highAlerts: alerts.filter((a) => a.severity === 'High').length,
    mediumAlerts: alerts.filter((a) => a.severity === 'Medium').length,
    avgPhPost: readings.length > 0
      ? parseFloat((readings.reduce((s, r) => s + r.ph_post, 0) / readings.length).toFixed(2))
      : 0,
    avgTdsPost: readings.length > 0
      ? parseFloat((readings.reduce((s, r) => s + r.tds_post, 0) / readings.length).toFixed(0))
      : 0,
    avgWaterLoss: readings.length > 0
      ? parseFloat((readings.reduce((s, r) => s + r.water_loss_percent, 0) / readings.length).toFixed(2))
      : 0,
  };

  return { readings, alerts, stats };
};

/**
 * Generate a CSV string from readings data.
 */
export const generateCSV = (readings) => {
  const headers = [
    'Timestamp', 'Device ID', 'pH Pre', 'pH Post', 'pH Delta',
    'TDS Pre', 'TDS Post', 'TDS Delta',
    'Flow Inlet', 'Flow Outlet', 'Water Loss', 'Water Loss %',
  ];

  const rows = readings.map((r) =>
    [
      r.timestamp ? new Date(r.timestamp).toISOString() : '',
      r.deviceId,
      r.ph_pre, r.ph_post, r.ph_delta,
      r.tds_pre, r.tds_post, r.tds_delta,
      r.flow_inlet, r.flow_outlet, r.water_loss, r.water_loss_percent,
    ].join(',')
  );

  return [headers.join(','), ...rows].join('\n');
};

/**
 * Generate a PDF report and pipe it to a writable stream.
 */
export const generatePDF = (reportData, stream) => {
  const { stats, alerts } = reportData;
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(stream);

  // ─── Header
  doc.fontSize(24).fillColor('#0d9488').text('HydroDetect FSD', { align: 'center' });
  doc.fontSize(12).fillColor('#475569').text('Effluent Water Quality Compliance Report', { align: 'center' });
  doc.moveDown();

  // ─── Report Info
  doc.fontSize(14).fillColor('#0f172a').text(`Report Period: ${stats.period.toUpperCase()}`);
  doc.fontSize(10).fillColor('#64748b')
    .text(`From: ${new Date(stats.from).toLocaleString()}`)
    .text(`To: ${new Date(stats.to).toLocaleString()}`);
  doc.moveDown();

  // ─── Summary
  doc.fontSize(16).fillColor('#0f172a').text('Summary', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor('#334155');

  const summaryItems = [
    ['Total Readings', stats.totalReadings],
    ['Total Alerts', stats.totalAlerts],
    ['Critical Alerts', stats.criticalAlerts],
    ['High Alerts', stats.highAlerts],
    ['Medium Alerts', stats.mediumAlerts],
    ['Avg pH (Post Treatment)', stats.avgPhPost],
    ['Avg TDS (Post Treatment)', `${stats.avgTdsPost} mg/L`],
    ['Avg Water Loss', `${stats.avgWaterLoss}%`],
  ];

  for (const [label, value] of summaryItems) {
    doc.text(`${label}: ${value}`);
  }
  doc.moveDown();

  // ─── Recent Alerts
  if (alerts.length > 0) {
    doc.fontSize(16).fillColor('#0f172a').text('Alert Details', { underline: true });
    doc.moveDown(0.5);

    const displayAlerts = alerts.slice(0, 30);
    for (const alert of displayAlerts) {
      const severityColor = {
        Critical: '#dc2626',
        High: '#ea580c',
        Medium: '#d97706',
        Low: '#65a30d',
      };

      doc.fontSize(10)
        .fillColor(severityColor[alert.severity] || '#334155')
        .text(`[${alert.severity}] ${alert.type} — ${alert.message}`, { continued: false });
      doc.fontSize(8)
        .fillColor('#94a3b8')
        .text(`  Device: ${alert.deviceId} | ${new Date(alert.createdAt).toLocaleString()}`);
      doc.moveDown(0.3);
    }

    if (alerts.length > 30) {
      doc.fontSize(9).fillColor('#94a3b8').text(`... and ${alerts.length - 30} more alerts`);
    }
  }

  // ─── Footer
  doc.moveDown(2);
  doc.fontSize(8).fillColor('#94a3b8')
    .text(`Generated: ${new Date().toLocaleString()} | HydroDetect FSD v1.0`, { align: 'center' });

  doc.end();
  return doc;
};

export default { getReportData, generateCSV, generatePDF };
