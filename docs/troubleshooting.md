# Troubleshooting & Diagnostics Guide

## Common Issues & Solutions

### 1. MongoDB Connection Failure
**Symptom:** Server log shows `[DB] MongoDB connection error: connect ECONNREFUSED 127.0.0.1:27017`
**Root Cause:** MongoDB service is not running locally or the connection string is incorrect.
**Fix:**
- Start local MongoDB service (`net start MongoDB` on Windows or `sudo systemctl start mongod` on Linux).
- Or provide a valid Atlas URI in `backend/.env`: `MONGODB_URI=mongodb+srv://...`

### 2. Socket.IO Connection Issues / Live Data Not Updating
**Symptom:** UI displays "Disconnected" or live feed stops updating.
**Fix:**
- Ensure backend server is running on port 5000 (`http://localhost:5000/api/health`).
- Check CORS settings in `backend/.env`: `FRONTEND_URL` must match frontend origin (`http://localhost:5173`).
- Verify firewall is allowing WebSocket connections.

### 3. Critical Alert Emails Not Sending
**Symptom:** Critical alerts are created, but no emails arrive in inbox.
**Fix:**
- Check backend stdout logs for `[EMAIL]` entries.
- If unconfigured, set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, and `ALERT_EMAIL_TO` in `.env`.
- For Gmail, verify 2FA is active and an App Password is used instead of normal password.

### 4. JWT Authorization / 401 Unauthorized Errors
**Symptom:** API requests return `401 Unauthorized` or redirect to `/login`.
**Fix:**
- Clear localStorage tokens in browser DevTools.
- Verify `JWT_SECRET` matches across restarts (avoid changing `JWT_SECRET` while users are logged in).

### 5. Simulator Not Emitting Data
**Symptom:** No readings appear in database or dashboard.
**Fix:**
- Check `backend/.env`: ensure `SIMULATOR_ENABLED=true`.
- Check backend console logs for `[SIMULATOR]` tick output.
