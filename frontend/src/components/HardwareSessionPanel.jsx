import { useState, useEffect } from 'react';
import { useSocketEvent } from '../hooks/useSocket';
import api from '../services/api';
import { MdSettingsInputHdmi, MdTerminal, MdRefresh, MdUsb, MdPlayArrow, MdStop } from 'react-icons/md';

export default function HardwareSessionPanel() {
  const [session, setSession] = useState({
    mode: 'simulator',
    port: 'Virtual (Sim)',
    baudRate: 115200,
    packetsReceived: 0,
    lastPacketAt: null,
    startedAt: new Date(),
    errors: 0,
  });
  const [availablePorts, setAvailablePorts] = useState([]);
  const [selectedPort, setSelectedPort] = useState('');
  const [baudRate, setBaudRate] = useState(115200);
  const [packetLog, setPacketLog] = useState([]);
  const [showConsole, setShowConsole] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState(null);

  // Fetch session & available serial ports on mount
  useEffect(() => {
    fetchSession();
    fetchPorts();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await api.get('/hardware/session');
      if (res.data.success && res.data.data) {
        setSession(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch hardware session:', err);
    }
  };

  const fetchPorts = async () => {
    try {
      const res = await api.get('/hardware/ports');
      if (res.data.success && res.data.data) {
        setAvailablePorts(res.data.data);
        if (res.data.data.length > 0 && !selectedPort) {
          setSelectedPort(res.data.data[0].path);
        }
      }
    } catch (err) {
      console.error('Failed to list serial ports:', err);
    }
  };

  useSocketEvent('hardware:packet', (data) => {
    if (data.session) setSession(data.session);
    setPacketLog((prev) => {
      const entry = `[${new Date(data.timestamp).toLocaleTimeString()}] RX: ${data.raw || JSON.stringify(data.payload)}`;
      return [entry, ...prev].slice(0, 40);
    });
  });

  useSocketEvent('hardware:session', (sess) => {
    setSession((prev) => ({ ...prev, ...sess }));
  });

  const handleModeSwitch = async (targetMode) => {
    setConnecting(true);
    setMessage(null);
    try {
      const res = await api.post('/hardware/mode', {
        mode: targetMode,
        portPath: selectedPort,
        baudRate: Number(baudRate),
      });
      if (res.data.success) {
        setSession(res.data.session || res.data.data);
        setMessage({ type: 'success', text: `Switched to ${targetMode.toUpperCase()} mode.` });
      } else {
        setMessage({ type: 'error', text: res.data.error || 'Failed to switch mode' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.message });
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectPort = async () => {
    if (!selectedPort) return;
    setConnecting(true);
    setMessage(null);
    try {
      const res = await api.post('/hardware/connect', {
        portPath: selectedPort,
        baudRate: Number(baudRate),
      });
      if (res.data.success) {
        setMessage({ type: 'success', text: res.data.message });
        fetchSession();
      } else {
        setMessage({ type: 'error', text: res.data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.message });
    } finally {
      setConnecting(false);
    }
  };

  const getUptime = () => {
    if (!session.startedAt) return '00:00:00';
    const diff = Date.now() - new Date(session.startedAt).getTime();
    const secs = Math.floor(diff / 1000);
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const [uptimeStr, setUptimeStr] = useState('00:00:00');
  useEffect(() => {
    const timer = setInterval(() => setUptimeStr(getUptime()), 1000);
    return () => clearInterval(timer);
  }, [session.startedAt]);

  const isConnected = session.lastPacketAt
    ? (Date.now() - new Date(session.lastPacketAt).getTime()) < 15000
    : true;

  return (
    <div className="dark-console-card rounded-[10px]" style={{ padding: '28px', lineHeight: '1.6' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 mb-7" style={{ borderBottom: '1px solid rgba(30,41,59,0.9)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-[#2DD4BF]/10 border border-[#2DD4BF]/30 flex items-center justify-center text-[#2DD4BF] flex-shrink-0">
            <MdSettingsInputHdmi className="text-xl" />
          </div>
          <div style={{ lineHeight: '1.6' }}>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-tight font-sans" style={{ lineHeight: '1.5' }}>
                Hardware Telemetry Interface
              </h2>
              <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-[10px] text-xs font-semibold ${session.mode === 'serial' ? 'bg-emerald-950 text-[#10B981] border border-emerald-800' : 'bg-teal-950 text-[#2DD4BF] border border-teal-800'}`}>
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                {session.mode === 'serial' ? 'ESP32 PHYSICAL SERIAL' : 'VIRTUAL SIMULATOR'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium font-sans" style={{ marginTop: '6px', lineHeight: '1.7' }}>
              Active Port: <strong className="font-mono text-slate-200">{session.port}</strong> @ <span className="font-mono text-[#2DD4BF] font-semibold">{session.baudRate} Baud</span> • Station: <strong className="font-mono text-slate-200">ESP-DYE-001</strong>
            </p>
          </div>
        </div>

        {/* Mode Selector Toggle Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleModeSwitch('simulator')}
            disabled={connecting || session.mode === 'simulator'}
            className={`px-4 py-2 rounded-[10px] text-xs font-semibold transition-all cursor-pointer ${session.mode === 'simulator' ? 'bg-[#2DD4BF] text-slate-950 font-bold shadow-xs' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}
          >
            Virtual Simulator
          </button>
          <button
            onClick={() => handleModeSwitch('serial')}
            disabled={connecting || session.mode === 'serial'}
            className={`px-4 py-2 rounded-[10px] text-xs font-semibold transition-all cursor-pointer ${session.mode === 'serial' ? 'bg-[#10B981] text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}
          >
            <MdUsb className="inline text-base mr-1" /> ESP32 Serial Hardware
          </button>
        </div>
      </div>

      {/* Hardware Connection Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-[10px] mb-7 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-sans" style={{ padding: '18px 20px' }}>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400 text-xs uppercase">COM / TTY Port:</span>
            <select
              value={selectedPort}
              onChange={(e) => setSelectedPort(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-[10px] font-mono text-xs font-semibold focus:border-[#2DD4BF] outline-none shadow-xs"
            >
              {availablePorts.length === 0 ? (
                <option value="">No Ports Detected (Scan)</option>
              ) : (
                availablePorts.map((p) => (
                  <option key={p.path} value={p.path}>
                    {p.path} — {p.manufacturer}
                  </option>
                ))
              )}
            </select>
            <button
              onClick={fetchPorts}
              className="p-1.5 rounded-[10px] bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 cursor-pointer"
              title="Rescan Hardware Ports"
            >
              <MdRefresh className="text-base" />
            </button>
          </div>

          <div className="flex items-center gap-2 font-sans">
            <span className="font-semibold text-slate-400 text-xs uppercase">Baud:</span>
            <select
              value={baudRate}
              onChange={(e) => setBaudRate(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-[10px] text-xs font-mono font-semibold outline-none shadow-xs"
            >
              <option value={115200}>115200</option>
              <option value={9600}>9600</option>
              <option value={57600}>57600</option>
            </select>
          </div>

          <button
            onClick={handleConnectPort}
            disabled={connecting || !selectedPort}
            className="px-4 py-2 rounded-[10px] bg-[#2DD4BF] text-slate-950 font-bold hover:bg-[#26b8a5] disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
          >
            {connecting ? 'Connecting...' : 'Connect Port'}
          </button>
        </div>

        {/* Counter Pill */}
        <div className="flex items-center gap-3 font-mono text-xs font-semibold">
          <span className="bg-teal-950/80 text-[#2DD4BF] border border-teal-800/80 px-3 py-1.5 rounded-[10px]">
            RX: {session.packetsReceived} Packets
          </span>
          <span className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-[10px]">
            Uptime: {uptimeStr}
          </span>
          <button
            onClick={() => setShowConsole(!showConsole)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors cursor-pointer font-sans"
          >
            <MdTerminal /> {showConsole ? 'Hide Console' : 'View Console'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-[10px] font-mono text-xs font-semibold ${message.type === 'success' ? 'bg-emerald-950 text-[#10B981] border border-emerald-800' : 'bg-red-950 text-[#EF4444] border border-red-800'}`}>
          {message.text}
        </div>
      )}

      {showConsole && (
      <div className="rounded-[10px] overflow-hidden border border-slate-800 shadow-lg bg-slate-950">
          <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-xs font-mono text-slate-300 font-semibold uppercase tracking-wider" style={{ lineHeight: '1.6' }}>
                LIVE UART TELEMETRY STREAM [{session.mode.toUpperCase()}]
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#2DD4BF] font-semibold uppercase bg-teal-950 px-2.5 py-0.5 rounded-[10px] border border-teal-800">UART STREAM ACTIVE</span>
          </div>
          <div className="p-5 h-48 font-mono text-xs text-[#2DD4BF] overflow-y-auto select-all bg-slate-950" style={{ lineHeight: '1.8' }}>
            {packetLog.length === 0 ? (
              <div className="text-slate-500 italic font-mono" style={{ lineHeight: '1.7' }}>Listening for hardware serial packets on UART... (JSON telemetry feed active)</div>
            ) : (
              <div className="space-y-2.5">
                {packetLog.map((log, index) => (
                  <div key={index} className="whitespace-pre-wrap border-b border-slate-900/80 pb-2 text-slate-300" style={{ lineHeight: '1.7' }}>
                    <span className="text-[#2DD4BF] font-semibold">{log.slice(0, 14)}</span>
                    <span className="text-slate-200">{log.slice(14)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
