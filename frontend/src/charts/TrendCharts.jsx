import { useState, useEffect, useCallback } from 'react';
import { analyticsAPI, deviceAPI } from '../services/api';
import { useSocketEvent } from '../hooks/useSocket';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { MdShowChart } from 'react-icons/md';

const LIMIT_OPTIONS = [50, 100, 500];

export default function TrendCharts() {
  const [data, setData] = useState([]);
  const [limit, setLimit] = useState(50);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTrends = useCallback(async () => {
    try {
      setLoading(true);
      const params = { limit };
      if (selectedDevice) params.deviceId = selectedDevice;
      const res = await analyticsAPI.getTrends(params);
      setData(res.data.data || []);
    } catch (err) {
      console.error('Trend fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [limit, selectedDevice]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await deviceAPI.getAll();
        setDevices(res.data.data || []);
      } catch (err) {
        console.error('Device fetch error:', err);
      }
    };
    fetchDevices();
  }, []);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  useSocketEvent('reading:new', (reading) => {
    if (selectedDevice && reading.deviceId !== selectedDevice) return;
    setData((prev) => {
      const updated = [...prev, reading];
      if (updated.length > limit) updated.shift();
      return updated;
    });
  });

  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-md text-xs font-mono">
        <p className="text-slate-500 mb-1.5 font-sans font-semibold border-b border-slate-100 pb-1">{formatTime(label)}</p>
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-3 py-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-600 font-sans font-medium">{entry.name}:</span>
            </div>
            <span className="font-bold text-slate-900">{entry.value?.toFixed?.(2) ?? entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="glass-card p-6 rounded-xl bg-white border border-slate-200 font-sans shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#2DD4BF] flex-shrink-0">
            <MdShowChart className="text-2xl" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-sans">Live Effluent Telemetry Trends</h2>
            <p className="text-xs text-slate-500 font-medium font-sans">Continuous telemetry streams & regulatory boundary limits</p>
          </div>
        </div>

        {/* Top-Right Chart Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:border-[#2DD4BF] outline-none font-mono font-semibold shadow-xs"
          >
            <option value="">ESP-DYE-001 (Main Station)</option>
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>{d.name} ({d.deviceId})</option>
            ))}
          </select>

          <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-1 shadow-xs">
            {LIMIT_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setLimit(opt)}
                className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
                  limit === opt
                    ? 'bg-white text-[#2DD4BF] font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {opt} Pts
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && data.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-7 h-7 border-2 border-teal-500/20 border-t-teal-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* pH Trends */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-4 font-sans">
              <span className="text-sm font-semibold text-slate-700">pH Levels (Pre vs Post Purification)</span>
              <span className="text-xs font-mono font-semibold text-[#10B981] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">Target Range: 6.5 – 8.5</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#e2e8f0" />
                <YAxis domain={[3, 11]} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#e2e8f0" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <ReferenceLine y={6.5} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: 'Min 6.5', fontSize: 10, fill: '#F59E0B' }} />
                <ReferenceLine y={8.5} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: 'Max 8.5', fontSize: 10, fill: '#F59E0B' }} />
                <Line type="monotone" dataKey="ph_pre" stroke="#94a3b8" name="pH Pre" dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="ph_post" stroke="#2DD4BF" name="pH Post" dot={false} strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* TDS Trends */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-4 font-sans">
              <span className="text-sm font-semibold text-slate-700">Total Dissolved Solids (mg/L)</span>
              <span className="text-xs font-mono font-semibold text-[#EF4444] bg-red-50 px-2.5 py-1 rounded-full border border-red-200">Max Limit: 500 mg/L</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#e2e8f0" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#e2e8f0" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <ReferenceLine y={500} stroke="#EF4444" strokeDasharray="4 4" label={{ value: '500 Limit', fontSize: 10, fill: '#EF4444' }} />
                <Line type="monotone" dataKey="tds_pre" stroke="#94a3b8" name="TDS Pre" dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="tds_post" stroke="#6366f1" name="TDS Post" dot={false} strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Flow Volume Trends */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-4 font-sans">
              <span className="text-sm font-semibold text-slate-700">Volumetric Water Flow (Liters)</span>
              <span className="text-xs font-mono font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">Cumulative Flow</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#e2e8f0" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#e2e8f0" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Line type="monotone" dataKey="flow_inlet" stroke="#0284c7" name="Flow Inlet" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="flow_outlet" stroke="#2DD4BF" name="Flow Outlet" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Water Loss % Trends */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-4 font-sans">
              <span className="text-sm font-semibold text-slate-700">Water Loss % (Bypass Detection)</span>
              <span className="text-xs font-mono font-semibold text-[#EF4444] bg-red-50 px-2.5 py-1 rounded-full border border-red-200">Critical: &gt;15%</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#e2e8f0" />
                <YAxis domain={[0, 40]} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#e2e8f0" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <ReferenceLine y={15} stroke="#EF4444" strokeDasharray="4 4" label={{ value: '15% Bypass', fontSize: 10, fill: '#EF4444' }} />
                <ReferenceLine y={5} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: '5% Warning', fontSize: 10, fill: '#F59E0B' }} />
                <Line type="monotone" dataKey="water_loss_percent" stroke="#EF4444" name="Water Loss %" dot={false} strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
