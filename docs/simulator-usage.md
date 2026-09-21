# Simulator Usage Guide

## Overview

The AquaSentinel simulator stands in for real ESP32 hardware. It generates realistic sensor readings for multiple simulated dyeing/finishing units.

## Configuration

In `backend/.env`:
```env
SIMULATOR_ENABLED=true       # Set to false to disable
SIMULATOR_INTERVAL_MS=5000   # One reading per device every 5 seconds
SIMULATOR_DEVICE_COUNT=3     # Number of simulated devices (1-5)
```

## Simulated Devices

| Device ID | Name | Factory | Location |
|-----------|------|---------|----------|
| SIM-DYE-001 | Dyeing Unit Alpha | Sunrise Textiles | Building A, Floor 1 |
| SIM-DYE-002 | Dyeing Unit Beta | Sunrise Textiles | Building B, Floor 2 |
| SIM-DYE-003 | Finishing Unit Gamma | Horizon Dyes Ltd | Building C, Ground |
| SIM-DYE-004 | Bleaching Unit Delta | Horizon Dyes Ltd | Building A, Floor 3 |
| SIM-DYE-005 | Washing Unit Epsilon | EcoFab Industries | Building D, Floor 1 |

## Data Ranges

| Parameter | Range | Notes |
|-----------|-------|-------|
| pH Pre | 4.0 – 9.5 | Untreated wastewater |
| pH Post | 6.3 – 8.7 | Treated (compliance: 6.5–8.5) |
| TDS Pre | 800 – 2500 | Untreated |
| TDS Post | 200 – 600 | Treated (compliance: ≤500) |
| Flow Inlet | Monotonically increasing | Cumulative liters |
| Flow Outlet | 92–100% of inlet (normal) | Normal water loss 0–8% |

## Forced Anomalies

**Every 10th reading per device** forces a critical bypass scenario:
- Water loss: **15–30%** (triggers Critical alert)
- May also force pH and/or TDS violations
- Logged to console with 🚨 emoji

This ensures the critical-alert path (including email attempt) is exercised reliably.

## Interface Contract

The Simulator implements the same interface as SerialService:
```javascript
simulator.start(io)   // Begin emitting readings
simulator.stop()      // Halt emission
simulator.isRunning   // Boolean
```

## Logs
Watch for these log messages:
```
[SIMULATOR] Initialized 3 devices
[SIMULATOR] Started — emitting every 5000ms for 3 devices
[SIMULATOR] 🚨 Forced anomaly on tick #10 for SIM-DYE-001 (water_loss: 22.3%)
```
