import express from 'express';
import { store } from '../utils/inMemoryStore.js';
import serialService from '../services/serialService.js';

const router = express.Router();

/**
 * GET /api/hardware/session
 * Returns current hardware session status & connectivity stats.
 */
router.get('/session', (req, res) => {
  const session = store.hardwareSession;
  const status = serialService.getStatus();
  const uptimeMs = Date.now() - new Date(session.startedAt).getTime();

  res.status(200).json({
    success: true,
    data: {
      ...session,
      isConnected: status.isConnected || (session.mode === 'simulator'),
      uptimeMs,
      uptimeFormatted: formatUptime(uptimeMs),
    },
  });
});

/**
 * GET /api/hardware/ports
 * List all available physical serial ports (COM1, COM3, /dev/ttyUSB0, etc.)
 */
router.get('/ports', async (req, res) => {
  try {
    const ports = await serialService.listPorts();
    res.status(200).json({
      success: true,
      count: ports.length,
      data: ports,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/hardware/mode
 * Body: { mode: 'simulator' | 'serial', portPath?: string, baudRate?: number }
 */
router.post('/mode', async (req, res) => {
  const { mode, portPath, baudRate } = req.body;
  if (!['simulator', 'serial'].includes(mode)) {
    return res.status(400).json({ success: false, error: 'Mode must be simulator or serial' });
  }

  try {
    const result = await serialService.setMode(mode, portPath, baudRate || 115200);
    res.status(200).json({
      success: true,
      data: result,
      session: store.hardwareSession,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/hardware/connect
 * Body: { portPath: string, baudRate?: number }
 */
router.post('/connect', async (req, res) => {
  const { portPath, baudRate } = req.body;
  if (!portPath) {
    return res.status(400).json({ success: false, error: 'portPath is required' });
  }

  try {
    const result = await serialService.connect(portPath, baudRate || 115200);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/hardware/disconnect
 */
router.post('/disconnect', async (req, res) => {
  try {
    await serialService.disconnect();
    res.status(200).json({ success: true, message: 'Hardware serial port disconnected.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

function formatUptime(ms) {
  const secs = Math.floor(ms / 1000);
  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default router;
