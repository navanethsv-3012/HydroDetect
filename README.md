# HydroDetect

AI-assisted IoT industrial water-effluent monitoring dashboard for textile/dyeing industry wastewater compliance.

## Overview

AquaSentinel ingests paired pre/post-purification sensor readings (pH, TDS, flow) from monitoring stations, detects volume-loss and parameter anomalies indicating bypass or tampering, and alerts stakeholders in real time.

## Architecture

```
Current:   Simulator → Backend (ingest + rules) → MongoDB → Socket.IO → Dashboard
Future:    ESP32 → USB Serial → SerialService → Backend (unchanged) → ...
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+ (local or Atlas)

### Installation

```bash
# Clone and install
git clone <repo-url>
cd AquaSentinel

# Backend
cd backend
npm install
cp .env.example .env   # Edit with your config
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Environment Variables

Copy `.env.example` to `backend/.env` and configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/aquasentinel` |
| `JWT_SECRET` | JWT signing secret | (required) |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `SMTP_HOST` | SMTP server host | (optional) |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | (optional) |
| `SMTP_PASS` | SMTP password | (optional) |
| `ALERT_EMAIL_TO` | Alert recipient email | (optional) |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

## Project Structure

```
AquaSentinel/
├── frontend/src/
│   ├── assets/          # Static assets
│   ├── components/      # Reusable UI components
│   ├── pages/           # Route pages
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API service layer
│   ├── context/         # React context providers
│   ├── layouts/         # Page layouts
│   ├── charts/          # Recharts chart components
│   └── utils/           # Utility functions
├── backend/
│   ├── config/          # DB, email, app config
│   ├── controllers/     # Route handlers
│   ├── middleware/       # Auth, validation, error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express route definitions
│   ├── sockets/         # Socket.IO event handlers
│   ├── services/        # Business logic layer
│   ├── simulator/       # Sensor data simulator
│   ├── serial/          # Future ESP32 serial service
│   └── utils/           # Helper utilities
├── database/            # DB scripts, seeds
├── docs/                # Full documentation
└── README.md
```

## License

ISC
