# Socket.IO Events

## Connection
```
URL: ws://localhost:5000
Transports: websocket, polling
```

## Server → Client Events

### `reading:new`
Emitted when a new sensor reading is persisted.
```json
{
  "deviceId": "SIM-DYE-001",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "ph_pre": 7.2,
  "ph_post": 7.0,
  "tds_pre": 1200,
  "tds_post": 350,
  "flow_inlet": 15234.5,
  "flow_outlet": 14500.2,
  "ph_delta": 0.2,
  "tds_delta": 850,
  "water_loss": 734.3,
  "water_loss_percent": 4.82
}
```

### `alert:new`
Emitted when a new alert is created.
```json
{
  "_id": "...",
  "deviceId": "SIM-DYE-001",
  "type": "water_bypass",
  "severity": "Critical",
  "message": "Possible untreated water bypass.",
  "values": { "water_loss_percent": 22.5 },
  "emailSent": true,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### `alert:updated`
Emitted when an alert is acknowledged.

### `device:status`
Emitted when a device status changes (online → offline after 120s inactivity).
```json
{
  "deviceId": "SIM-DYE-001",
  "status": "offline",
  "lastSeen": "2024-01-15T10:28:00.000Z"
}
```

### `stats:update`
Emitted after each reading with updated dashboard statistics.

## Client → Server Events

### `subscribe:device`
Join a device-specific room for targeted updates.
```js
socket.emit('subscribe:device', 'SIM-DYE-001');
```

### `unsubscribe:device`
Leave a device-specific room.
```js
socket.emit('unsubscribe:device', 'SIM-DYE-001');
```

## Rooms
- Global: all clients receive `reading:new`, `alert:new`, `stats:update`
- Per-device: `device:<deviceId>` — clients subscribed to a specific device also receive targeted events
