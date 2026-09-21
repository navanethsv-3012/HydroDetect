import { useState, useEffect } from 'react';
import { deviceAPI } from '../services/api';
import { useSocketEvent } from '../hooks/useSocket';
import { MdDevicesOther, MdLocationOn } from 'react-icons/md';
import { motion } from 'framer-motion';

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await deviceAPI.getAll();
        setDevices(res.data.data || []);
      } catch (err) {
        console.error('Devices fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  useSocketEvent('device:status', (update) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.deviceId === update.deviceId ? { ...d, status: update.status, lastSeen: update.lastSeen } : d
      )
    );
  });

  const statusCfg = {
    online: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'ONLINE' },
    offline: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', label: 'OFFLINE' },
    disconnected: { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', label: 'DISCONNECTED' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-teal-500/20 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 flex-shrink-0">
            <MdDevicesOther className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Monitoring Devices Station Directory</h1>
            <p className="text-xs text-slate-500 font-medium">Paired IoT Hardware Controllers</p>
          </div>
        </div>

        <span className="text-xs font-mono font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
          {devices.filter((d) => d.status === 'online').length} / {devices.length} Online
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {devices.map((device, i) => {
          const cfg = statusCfg[device.status] || statusCfg.offline;
          return (
            <motion.div
              key={device.deviceId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5 border border-slate-200/80"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{device.name}</h3>
                  <p className="text-xs font-mono font-semibold text-teal-700 mt-0.5">{device.deviceId}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                  {cfg.label}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <MdLocationOn className="text-slate-400 text-sm" />
                  <span>{device.location}</span>
                </div>
                {device.factoryName && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">🏭</span>
                    <span>{device.factoryName}</span>
                  </div>
                )}
                {device.lastSeen && (
                  <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 font-mono">
                    Last Seen: {new Date(device.lastSeen).toLocaleString()}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
