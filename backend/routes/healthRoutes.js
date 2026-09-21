import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

/**
 * GET /api/health
 * System health check — returns server status, DB state, uptime, memory usage.
 */
router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    success: true,
    data: {
      status: 'operational',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: dbStates[dbState] || 'unknown',
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      },
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

export default router;
