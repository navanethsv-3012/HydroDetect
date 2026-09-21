import mongoose from 'mongoose';
import Alert from '../models/Alert.js';
import Device from '../models/Device.js';
import { sendAlertEmail } from '../config/email.js';
import { store } from '../utils/inMemoryStore.js';

export const evaluateAlerts = async (deviceId, reading, io) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  const alertsToCreate = [];

  // ─── pH Violation (High) ──────────────────────────────────
  if (reading.ph_post < 6.5 || reading.ph_post > 8.5) {
    alertsToCreate.push({
      deviceId,
      type: 'ph_violation',
      severity: 'High',
      message: `pH post-treatment out of range: ${reading.ph_post} (acceptable range: 6.5–8.5)`,
      values: {
        ph_pre: reading.ph_pre,
        ph_post: reading.ph_post,
        ph_delta: reading.ph_delta,
      },
    });
  }

  // ─── TDS Violation (High) ─────────────────────────────────
  if (reading.tds_post > 500) {
    alertsToCreate.push({
      deviceId,
      type: 'tds_violation',
      severity: 'High',
      message: `TDS post-treatment exceeds limit: ${reading.tds_post} mg/L (limit: 500 mg/L)`,
      values: {
        tds_pre: reading.tds_pre,
        tds_post: reading.tds_post,
        tds_delta: reading.tds_delta,
      },
    });
  }

  // ─── Critical Water Bypass (>15%) ─────────────────────────
  if (reading.water_loss_percent > 15) {
    alertsToCreate.push({
      deviceId,
      type: 'water_bypass',
      severity: 'Critical',
      message: 'Possible untreated water bypass.',
      values: {
        flow_inlet: reading.flow_inlet,
        flow_outlet: reading.flow_outlet,
        water_loss: reading.water_loss,
        water_loss_percent: reading.water_loss_percent,
      },
    });
  }
  // ─── Medium Water Loss (5–15%) ────────────────────────────
  else if (reading.water_loss_percent > 5) {
    alertsToCreate.push({
      deviceId,
      type: 'water_loss',
      severity: 'Medium',
      message: `Elevated water loss detected: ${reading.water_loss_percent}%`,
      values: {
        flow_inlet: reading.flow_inlet,
        flow_outlet: reading.flow_outlet,
        water_loss: reading.water_loss,
        water_loss_percent: reading.water_loss_percent,
      },
    });
  }

  // ─── Persist & Broadcast ──────────────────────────────────
  const createdAlerts = [];
  for (const alertData of alertsToCreate) {
    let alertObj;
    if (isMongoConnected) {
      const alert = await Alert.create(alertData);
      alertObj = alert.toObject();
      if (alert.severity === 'Critical') {
        const emailSent = await sendCriticalAlertEmail(deviceId, alert, reading);
        alert.emailSent = emailSent;
        await alert.save();
        alertObj.emailSent = emailSent;
      }
    } else {
      alertObj = {
        _id: `alt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ...alertData,
        acknowledged: false,
        emailSent: false,
        createdAt: new Date(),
      };
      if (alertObj.severity === 'Critical') {
        alertObj.emailSent = await sendCriticalAlertEmail(deviceId, alertObj, reading);
      }
      store.alerts.unshift(alertObj);
      if (store.alerts.length > 500) store.alerts.pop();
    }

    if (io) {
      io.emit('alert:new', alertObj);
      io.to(`device:${deviceId}`).emit('alert:new', alertObj);
    }

    createdAlerts.push(alertObj);
  }

  return createdAlerts;
};

const sendCriticalAlertEmail = async (deviceId, alert, reading) => {
  try {
    const to = process.env.ALERT_EMAIL_TO;
    if (!to) {
      console.log(`[ALERT EMAIL] Would have sent Critical alert email for ${deviceId} (ALERT_EMAIL_TO unconfigured)`);
      return false;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 20px; border-radius: 12px;">
        <h2 style="color: #ef4444; margin-top: 0;">🚨 CRITICAL: Effluent Bypass Alert</h2>
        <p><strong>Device ID:</strong> ${deviceId}</p>
        <p><strong>Alert Message:</strong> ${alert.message}</p>
        <p><strong>Water Loss %:</strong> ${reading.water_loss_percent}% (${reading.water_loss} L)</p>
        <p><strong>Flow Inlet:</strong> ${reading.flow_inlet} L | <strong>Flow Outlet:</strong> ${reading.flow_outlet} L</p>
        <hr style="border-color: #334155;" />
        <p style="font-size: 11px; color: #94a3b8;">AquaSentinel Wastewater Intelligence System</p>
      </div>
    `;

    return await sendAlertEmail({
      to,
      subject: `🚨 CRITICAL: ${alert.message} — Device ${deviceId}`,
      html,
    });
  } catch (err) {
    console.error(`[ALERT EMAIL] Error: ${err.message}`);
    return false;
  }
};

export default { evaluateAlerts };
