import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config();

// ES Module dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
import errorHandler from './middleware/errorHandler.js';

// Routes
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import readingRoutes from './routes/readingRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import hardwareRoutes from './routes/hardwareRoutes.js';

const app = express();

// ─── CORS ────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// ─── Body Parsers ────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging (Morgan) ────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/hardware', hardwareRoutes);

// ─── Production Static Serving ───────────────────────────────
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));

// ─── 404 & SPA Fallback ──────────────────────────────────────
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      error: `Route ${req.method} ${req.originalUrl} not found.`,
    });
  }
  // Serve SPA index.html if dist exists
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.originalUrl} not found.`,
      });
    }
  });
});

// ─── Error Handler (must be last) ────────────────────────────
app.use(errorHandler);

export default app;
