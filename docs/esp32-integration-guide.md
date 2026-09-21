# ESP32 Integration Guide

## Overview

AquaSentinel is designed with a clean **hardware integration seam**. The backend's `ingestReading()` function is the single entry point for all sensor data — both the Simulator and the future SerialService call this same function.

**Swapping from simulator to real hardware requires NO changes** to controllers, Socket.IO layer, or frontend.

## Architecture

```
ESP32 → USB Serial → SerialService.js → ingestReading() → MongoDB → Socket.IO → Dashboard
```

## SerialService Interface

The SerialService (`backend/serial/SerialService.js`) implements the same interface as the Simulator:

```javascript
class SerialService {
  async start(io, options = {})  // Start listening on serial port
  stop()                          // Close serial connection
  isRunning                       // Boolean status
}
```

## Step-by-Step Integration

### 1. Install SerialPort
```bash
cd backend
npm install serialport @serialport/parser-readline
```

### 2. ESP32 Firmware
Program your ESP32 to output JSON over serial at 115200 baud:
```json
{"deviceId":"ESP-DYE-001","ph_pre":7.2,"ph_post":7.0,"tds_pre":1200,"tds_post":350,"flow_inlet":15234.5,"flow_outlet":14500.2}
```

### 3. Uncomment SerialService Code
Open `backend/serial/SerialService.js` and uncomment the marked sections:
- SerialPort import
- Port connection in `start()`
- Port close in `stop()`

### 4. Update server.js
Replace the simulator start with SerialService:
```javascript
import serialService from './serial/SerialService.js';

// Instead of: await startSimulator(io);
await serialService.start(io, { path: 'COM3', baudRate: 115200 });
```

### 5. Set SIMULATOR_ENABLED=false
In `.env`:
```
SIMULATOR_ENABLED=false
```

## Expected Serial Data Format

Each line from ESP32 must be a complete JSON object ending with `\n`:

| Field | Type | Description |
|-------|------|-------------|
| `deviceId` | string | Unique device identifier |
| `ph_pre` | number | pH before treatment |
| `ph_post` | number | pH after treatment |
| `tds_pre` | number | TDS before treatment (mg/L) |
| `tds_post` | number | TDS after treatment (mg/L) |
| `flow_inlet` | number | Cumulative inlet flow (liters) |
| `flow_outlet` | number | Cumulative outlet flow (liters) |

## Troubleshooting

- **Port not found**: Check `COM` port in Device Manager (Windows) or `ls /dev/tty*` (Linux/Mac)
- **Permission denied (Linux)**: `sudo chmod 666 /dev/ttyUSB0` or add user to `dialout` group
- **Garbled data**: Verify baud rate matches ESP32 firmware (default: 115200)
- **No readings appearing**: Check serial monitor first to confirm ESP32 is outputting valid JSON
