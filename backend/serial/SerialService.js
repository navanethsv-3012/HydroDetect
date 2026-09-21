/**
 * SerialService — Future ESP32 Hardware Integration Stub
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  THIS IS A DOCUMENTED STUB.                                │
 * │  It implements the same interface as Simulator.js:          │
 * │    - start(io)  → begins reading from serial port           │
 * │    - stop()     → closes serial connection                  │
 * │    - isRunning  → boolean                                   │
 * │                                                             │
 * │  When real ESP32 hardware is connected:                     │
 * │  1. npm install serialport                                  │
 * │  2. Uncomment the SerialPort import and connection logic    │
 * │  3. Parse incoming serial data into the payload format      │
 * │  4. Call ingestReading(deviceId, payload, io) — same as     │
 * │     the simulator does                                      │
 * │                                                             │
 * │  NO changes needed to controllers, sockets, or frontend.   │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Expected serial data format from ESP32 (JSON):
 * {
 *   "deviceId": "ESP-DYE-001",
 *   "ph_pre": 7.2,
 *   "ph_post": 7.0,
 *   "tds_pre": 1200,
 *   "tds_post": 350,
 *   "flow_inlet": 15234.5,
 *   "flow_outlet": 14500.2
 * }
 *
 * Data flow:
 *   ESP32 → USB Serial → SerialService.parseData() → ingestReading() → MongoDB → Socket.IO → Dashboard
 */

// TODO: Uncomment when real hardware is connected
// import { SerialPort } from 'serialport';
// import { ReadlineParser } from '@serialport/parser-readline';
import { ingestReading } from '../services/ingestionService.js';

class SerialService {
  constructor() {
    this.port = null;
    this.parser = null;
    this.io = null;
    this.isRunning = false;
  }

  /**
   * Start listening on serial port.
   * Shared interface with Simulator.
   *
   * @param {Object} io - Socket.IO server instance
   * @param {Object} options - Serial port options
   * @param {string} options.path - Serial port path (e.g., 'COM3' on Windows, '/dev/ttyUSB0' on Linux)
   * @param {number} options.baudRate - Baud rate (default: 115200)
   */
  async start(io, options = {}) {
    if (this.isRunning) {
      console.warn('[SERIAL] Already running.');
      return;
    }

    this.io = io;

    // TODO: Uncomment when real hardware is connected
    // const { path = 'COM3', baudRate = 115200 } = options;
    //
    // this.port = new SerialPort({ path, baudRate });
    // this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));
    //
    // this.parser.on('data', (line) => {
    //   this.handleData(line);
    // });
    //
    // this.port.on('error', (err) => {
    //   console.error(`[SERIAL] Port error: ${err.message}`);
    // });
    //
    // this.port.on('close', () => {
    //   console.log('[SERIAL] Port closed.');
    //   this.isRunning = false;
    // });

    this.isRunning = true;
    console.log('[SERIAL] SerialService started (STUB — no real hardware connected)');
  }

  /**
   * Stop the serial connection.
   * Shared interface with Simulator.
   */
  stop() {
    // TODO: Uncomment when real hardware is connected
    // if (this.port && this.port.isOpen) {
    //   this.port.close();
    // }

    this.isRunning = false;
    console.log('[SERIAL] SerialService stopped.');
  }

  /**
   * Handle incoming serial data line.
   * Parses JSON and calls the shared ingestReading() function.
   *
   * @param {string} line - Raw serial data line (JSON string)
   */
  async handleData(line) {
    try {
      const data = JSON.parse(line.trim());
      const { deviceId, ...payload } = data;

      if (!deviceId) {
        console.warn('[SERIAL] Received data without deviceId:', line);
        return;
      }

      await ingestReading(deviceId, payload, this.io);
    } catch (error) {
      console.error(`[SERIAL] Failed to parse/ingest data: ${error.message}`);
    }
  }
}

// Singleton instance
const serialService = new SerialService();
export default serialService;
