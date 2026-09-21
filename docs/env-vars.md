# Environment Variables

All environment variables are configured in `backend/.env`. Copy from `.env.example`:

```bash
cp .env.example backend/.env
```

## Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/aquasentinel` |
| `JWT_SECRET` | Secret for signing JWT tokens | `your-secret-key-change-in-production` |

## Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

## SMTP (Email Alerts)

| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | _(none — emails disabled)_ |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username/email | _(none)_ |
| `SMTP_PASS` | SMTP password/app password | _(none)_ |
| `SMTP_FROM` | Sender email address | `aquasentinel@noreply.com` |
| `ALERT_EMAIL_TO` | Alert recipient email | _(none)_ |

> **Note:** If SMTP variables are not set, the system will log email content to console instead of sending. The server will NOT crash.

## Simulator

| Variable | Description | Default |
|----------|-------------|---------|
| `SIMULATOR_ENABLED` | Enable/disable simulator | `true` |
| `SIMULATOR_INTERVAL_MS` | Reading interval in ms | `5000` |
| `SIMULATOR_DEVICE_COUNT` | Number of simulated devices (1-5) | `3` |
