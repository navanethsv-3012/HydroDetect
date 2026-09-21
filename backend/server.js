import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

// Load env vars before anything else
dotenv.config();

import app from './app.js';
import connectDB from './config/db.js';
import { initSocketHandlers } from './sockets/socketHandler.js';
import { startSimulator } from './simulator/index.js';
import serialService from './services/serialService.js';

const PORT = process.env.PORT || 5000;

// ─── Create HTTP Server ──────────────────────────────────────
const server = http.createServer(app);

// ─── Socket.IO Setup ─────────────────────────────────────────
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible to the rest of the app
app.set('io', io);

// Initialize Socket.IO handlers & Serial Service
initSocketHandlers(io);
serialService.setSocketIO(io);

// ─── Start Server ────────────────────────────────────────────
const startServer = async () => {
  try {
    // Connect to MongoDB (with in-memory fallback if offline)
    await connectDB();

    // Start listening
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\n${'═'.repeat(60)}`);
      console.log(`  🌊 HydroDetect Effluent Intelligence Platform`);
      console.log(`  ├─ Mode:        ${process.env.NODE_ENV || 'development'}`);
      console.log(`  ├─ Port:        ${PORT}`);
      console.log(`  ├─ API Base:    http://localhost:${PORT}/api`);
      console.log(`  ├─ Health:      http://localhost:${PORT}/api/health`);
      console.log(`  └─ Hardware:    ESP32 USB Serial + Virtual Seam Active`);
      console.log(`${'═'.repeat(60)}\n`);
    });

    // Start simulator default after server is ready
    await startSimulator(io);
  } catch (error) {
    console.error('[SERVER] Startup failed:', error.message);
  }
};

startServer();

export { io, server };
