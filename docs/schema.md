# Data Schema Reference

## MongoDB Collections

### Devices
```javascript
{
  deviceId:    String,    // Unique, indexed (e.g., "SIM-DYE-001")
  name:        String,    // Human-readable name
  location:    String,    // Physical location
  factoryName: String,    // Factory name
  status:      String,    // "online" | "offline" | "disconnected"
  lastSeen:    Date,      // Last data received timestamp
  createdAt:   Date,      // Auto
  updatedAt:   Date       // Auto
}
// Indexes: { deviceId: 1 } (unique)
```

### Readings
```javascript
{
  deviceId:           String,   // Indexed
  timestamp:          Date,     // Indexed
  ph_pre:             Number,   // pH before treatment
  ph_post:            Number,   // pH after treatment
  tds_pre:            Number,   // TDS before (mg/L)
  tds_post:           Number,   // TDS after (mg/L)
  flow_inlet:         Number,   // Cumulative inlet (liters)
  flow_outlet:        Number,   // Cumulative outlet (liters)
  ph_delta:           Number,   // Computed: ph_pre - ph_post
  tds_delta:          Number,   // Computed: tds_pre - tds_post
  water_loss:         Number,   // Computed: flow_inlet - flow_outlet
  water_loss_percent: Number,   // Computed: (loss / inlet) * 100
  createdAt:          Date,
  updatedAt:          Date
}
// Indexes: { deviceId: 1, timestamp: -1 } (compound)
```

### Alerts
```javascript
{
  deviceId:       String,   // Indexed
  type:           String,   // "ph_violation" | "tds_violation" | "water_bypass" | "water_loss" | "device_offline"
  severity:       String,   // "Low" | "Medium" | "High" | "Critical"
  message:        String,   // Human-readable alert message
  values:         Mixed,    // Snapshot of values that triggered the alert
  acknowledged:   Boolean,  // Default: false
  acknowledgedBy: String,   // Email of user who acknowledged
  acknowledgedAt: Date,
  emailSent:      Boolean,  // Whether email notification was sent
  createdAt:      Date,
  updatedAt:      Date
}
// Indexes: { deviceId: 1, createdAt: -1 }, { severity: 1 }
```

### Users
```javascript
{
  name:         String,
  email:        String,   // Unique, indexed
  passwordHash: String,   // bcrypt hashed
  role:         String,   // "admin" | "authority" | "operator"
  createdAt:    Date,
  updatedAt:    Date
}
// Indexes: { email: 1 } (unique)
```

## Alert Rules

| Condition | Severity | Type |
|-----------|----------|------|
| `ph_post < 6.5 OR ph_post > 8.5` | High | ph_violation |
| `tds_post > 500` | High | tds_violation |
| `water_loss_percent > 15` | Critical | water_bypass |
| `water_loss_percent > 5 AND <= 15` | Medium | water_loss |
| No reading for 120 seconds | — | device_offline (status change) |
