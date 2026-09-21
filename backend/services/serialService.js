import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { ingestReading } from './ingestionService.js';
import { store } from '../utils/inMemoryStore.js';
import simulator from '../simulator/Simulator.js';

/**
 * SerialService — Hardware Communication Interface for ESP32 Microcontrollers
 *
 * Ingests real-time serial telemetry from ESP32 over USB/UART Serial Port
 * and routes it seamlessly into the AquaSentinel ingestion pipeline.
 *
 * Seam Architecture:
 * ESP32 → USB Serial (115200 baud) → SerialService → ingestReading() → Socket.IO / DB → Dashboard
 */

class SerialService {
  constructor() {
    this.port = null;
    this.parser = null;
    this.io = null;
    this.currentPortPath = null;
    this.baudRate = 115200;
    this.isConnected = false;
    this.mode = 'simulator'; // Default 'simulator' | 'serial'
    this.reconnectTimer = null;
  }

  /**
   * Set Socket.IO reference for real-time broadcasting
   */
  setSocketIO(io) {
    this.io = io;
  }

  /**
   * List all available physical hardware serial ports (COM ports / TTY devices)
   */
  async listPorts() {
    try {
      const ports = await SerialPort.list();
      return ports.map((p) => ({
        path: p.path,
        manufacturer: p.manufacturer || 'Unknown Device',
        serialNumber: p.serialNumber || 'N/A',
        pnpId: p.pnpId || '',
        vendorId: p.vendorId || '',
        productId: p.productId || '',
      }));
    } catch (error) {
      console.error('[SERIAL] Error listing serial ports:', error.message);
      return [];
    }
  }

  /**
   * Switch operation mode between 'simulator' and 'serial'
   */
  async setMode(targetMode, portPath = null, baudRate = 115200) {
    this.mode = targetMode;

    if (targetMode === 'serial') {
      // Pause simulator when switching to physical hardware
      simulator.stop();
      store.hardwareSession.mode = 'serial';
      store.hardwareSession.port = portPath || 'Auto-scan';
      store.hardwareSession.baudRate = baudRate;

      if (portPath) {
        return await this.connect(portPath, baudRate);
      } else {
        // Auto-connect to first available ESP32 / USB Serial port
        return await this.autoConnect(baudRate);
      }
    } else {
      // Switch back to virtual simulator
      await this.disconnect();
      store.hardwareSession.mode = 'simulator';
      store.hardwareSession.port = 'Virtual (Sim)';
      store.hardwareSession.baudRate = 115200;

      if (this.io && !simulator.isRunning) {
        await simulator.start(this.io);
      }

      this.broadcastSession();
      return { success: true, mode: 'simulator', message: 'Switched to Virtual Hardware Simulator' };
    }
  }

  /**
   * Automatically detect and connect to ESP32 USB Serial port
   */
  async autoConnect(baudRate = 115200) {
    const ports = await this.listPorts();
    if (ports.length === 0) {
      console.warn('[SERIAL] No physical serial ports detected on host system.');
      return {
        success: false,
        error: 'No physical COM / USB serial ports found on host system.',
        ports: [],
      };
    }

    // Look for common ESP32 / Silicon Labs / CH340 / FTDI vendor signatures
    const esp32Port = ports.find((p) => {
      const m = (p.manufacturer || '').toLowerCase();
      const path = p.path.toLowerCase();
      return (
        m.includes('silicon labs') ||
        m.includes('ch340') ||
        m.includes('ftdi') ||
        m.includes('expressif') ||
        m.includes('arduino') ||
        path.includes('ttyusb') ||
        path.includes('ttyacm')
      );
    }) || ports[0]; // Fallback to first port if no specific vendor matched

    console.log(`[SERIAL] Auto-selected port: ${esp32Port.path} (${esp32Port.manufacturer})`);
    return await this.connect(esp32Port.path, baudRate);
  }

  /**
   * Open serial connection to target port path
   */
  async connect(portPath, baudRate = 115200) {
    if (this.isConnected && this.currentPortPath === portPath) {
      return { success: true, message: `Already connected to ${portPath}` };
    }

    // Close any open port first
    await this.disconnect();

    this.currentPortPath = portPath;
    this.baudRate = Number(baudRate);

    return new Promise((resolve) => {
      try {
        console.log(`[SERIAL] Opening port ${portPath} @ ${this.baudRate} baud...`);
        this.port = new SerialPort({
          path: portPath,
          baudRate: this.baudRate,
          autoOpen: false,
        });

        this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

        this.port.open((err) => {
          if (err) {
            console.error(`[SERIAL] Failed to open ${portPath}:`, err.message);
            this.isConnected = false;
            store.hardwareSession.mode = 'serial';
            store.hardwareSession.port = `${portPath} (Failed)`;
            store.hardwareSession.errors++;
            this.broadcastSession();

            return resolve({
              success: false,
              error: `Failed to open serial port ${portPath}: ${err.message}`,
            });
          }

          this.isConnected = true;
          store.hardwareSession.mode = 'serial';
          store.hardwareSession.port = portPath;
          store.hardwareSession.baudRate = this.baudRate;
          store.hardwareSession.startedAt = new Date();
          console.log(`[SERIAL] ✅ Connected to ESP32 hardware on ${portPath}`);

          this.broadcastSession();

          // Listen for incoming serial line data
          this.parser.on('data', (line) => this.handleDataLine(line));

          // Error & Close event listeners
          this.port.on('error', (err) => {
            console.error('[SERIAL] Port error:', err.message);
            store.hardwareSession.errors++;
            this.broadcastSession();
          });

          this.port.on('close', () => {
            console.warn(`[SERIAL] Port ${portPath} closed.`);
            this.isConnected = false;
            this.broadcastSession();
          });

          resolve({
            success: true,
            message: `Successfully connected to ESP32 on ${portPath}`,
            port: portPath,
            baudRate: this.baudRate,
          });
        });
      } catch (error) {
        console.error('[SERIAL] Connection exception:', error.message);
        resolve({ success: false, error: error.message });
      }
    });
  }

  /**
   * Close active serial port connection
   */
  async disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.port && this.port.isOpen) {
      return new Promise((resolve) => {
        this.port.close((err) => {
          if (err) console.error('[SERIAL] Error closing port:', err.message);
          this.port = null;
          this.parser = null;
          this.isConnected = false;
          console.log('[SERIAL] Port closed.');
          resolve();
        });
      });
    } else {
      this.port = null;
      this.parser = null;
      this.isConnected = false;
    }
  }

  /**
   * Parse incoming serial data line from ESP32
   * Formats supported:
   * 1. JSON string: {"deviceId":"ESP-DYE-001","ph_pre":7.4,"ph_post":7.1,"tds_pre":1200,"tds_post":350,"flow_inlet":150,"flow_outlet":148}
   * 2. Key-Value string: deviceId=ESP-DYE-001,ph_pre=7.4,ph_post=7.1,tds_pre=1200,tds_post=350,flow_inlet=150,flow_outlet=148
   */
  async handleDataLine(rawLine) {
    const line = rawLine.trim();
    if (!line) return;

    try {
      let payload = null;
      let deviceId = 'ESP-DYE-001';

      if (line.startsWith('{') && line.endsWith('}')) {
        // Parse JSON format
        const parsed = JSON.parse(line);
        deviceId = parsed.deviceId || 'ESP-DYE-001';
        payload = {
          ph_pre: parseFloat(parsed.ph_pre ?? parsed.phPre ?? 7.0),
          ph_post: parseFloat(parsed.ph_post ?? parsed.phPost ?? 7.0),
          tds_pre: parseFloat(parsed.tds_pre ?? parsed.tdsPre ?? 1000),
          tds_post: parseFloat(parsed.tds_post ?? parsed.tdsPost ?? 350),
          flow_inlet: parseFloat(parsed.flow_inlet ?? parsed.flowInlet ?? 100),
          flow_outlet: parseFloat(parsed.flow_outlet ?? parsed.flowOutlet ?? 98),
        };
      } else if (line.includes('=')) {
        // Parse Key-Value format (e.g. ph_post=7.2,tds_post=400)
        const parts = line.split(',');
        const parsed = {};
        for (const part of parts) {
          const [k, v] = part.split('=').map((s) => s.trim());
          if (k && v !== undefined) parsed[k] = v;
        }

        deviceId = parsed.deviceId || 'ESP-DYE-001';
        payload = {
          ph_pre: parseFloat(parsed.ph_pre || 7.0),
          ph_post: parseFloat(parsed.ph_post || 7.0),
          tds_pre: parseFloat(parsed.tds_pre || 1000),
          tds_post: parseFloat(parsed.tds_post || 350),
          flow_inlet: parseFloat(parsed.flow_inlet || 100),
          flow_outlet: parseFloat(parsed.flow_outlet || 98),
        };
      }

      if (payload) {
        // Process through standard ingestion pipeline (rules + DB/memory + Socket.IO)
        await ingestReading(deviceId, payload, this.io);

        // Update hardware session state
        store.hardwareSession.packetsReceived++;
        store.hardwareSession.lastPacketAt = new Date();

        // Emit live hardware packet event
        if (this.io) {
          this.io.emit('hardware:packet', {
            deviceId,
            timestamp: new Date().toISOString(),
            raw: line,
            payload,
            session: store.hardwareSession,
          });
        }
      }
    } catch (error) {
      console.error('[SERIAL] Error parsing serial payload line:', error.message, '| Raw line:', line);
      store.hardwareSession.errors++;
    }
  }

  /**
   * Broadcast current hardware session metadata over Socket.IO
   */
  broadcastSession() {
    if (this.io) {
      this.io.emit('hardware:session', {
        ...store.hardwareSession,
        isConnected: this.isConnected,
      });
    }
  }

  /**
   * Get current serial service status
   */
  getStatus() {
    return {
      mode: this.mode,
      isConnected: this.isConnected,
      currentPort: this.currentPortPath,
      baudRate: this.baudRate,
      session: store.hardwareSession,
    };
  }
}

const serialService = new SerialService();
export default serialService;
