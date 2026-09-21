# AquaSentinel API Reference

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints except `/auth/login` and `/auth/register` (first user) require a JWT token.

Include in headers:
```
Authorization: Bearer <token>
```

---

## Auth

### POST /auth/register
Create a new user. First registration is open (creates admin). Subsequent registrations require admin auth.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123",
  "role": "operator"   // admin | authority | operator
}
```

**Response:** `201`
```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "name": "...", "email": "...", "role": "admin" },
    "token": "eyJhbGciOi..."
  }
}
```

### POST /auth/login
**Body:**
```json
{ "email": "john@example.com", "password": "securepass123" }
```

### GET /auth/me
Returns the current authenticated user profile.

---

## Devices

### GET /devices
Query params: `status` (online|offline|disconnected)

### GET /devices/:id
Get device by deviceId.

### POST /devices
**Requires:** admin role.
```json
{
  "deviceId": "ESP-001",
  "name": "Dyeing Unit Alpha",
  "location": "Building A",
  "factoryName": "Sunrise Textiles"
}
```

### PUT /devices/:id
**Requires:** admin or authority role.

### DELETE /devices/:id
**Requires:** admin role.

---

## Readings

### GET /readings
Query params: `deviceId`, `limit` (default 50, max 500), `page`, `from` (ISO date), `to` (ISO date), `sort` (e.g. `-timestamp`)

### GET /readings/latest
Latest reading per device, or for a specific `deviceId`.

### GET /readings/trends
Query params: `deviceId`, `limit` (50|100|500)

---

## Alerts

### GET /alerts
Query params: `severity`, `deviceId`, `acknowledged` (true|false), `type`, `limit`, `page`

### GET /alerts/summary
Alert counts grouped by severity.

### PUT /alerts/:id/acknowledge
**Requires:** admin or authority role.

---

## Analytics

### GET /analytics/summary
Dashboard summary: device counts, reading totals, alert counts, averages.

### GET /analytics/trends
Query params: `deviceId`, `limit`

### GET /analytics/efficiency
Treatment efficiency per device.

---

## Reports

### GET /reports/:period
Download a report. Period: `daily` | `weekly` | `monthly`.
Query params: `format` (pdf|csv, default: pdf)

### GET /reports/:period/data
Raw report data as JSON.

---

## Health

### GET /health
Server health check. No auth required.

```json
{
  "success": true,
  "data": {
    "status": "operational",
    "database": "connected",
    "uptime": 3600,
    "memory": { "rss": "45 MB", "heapUsed": "30 MB" }
  }
}
```
