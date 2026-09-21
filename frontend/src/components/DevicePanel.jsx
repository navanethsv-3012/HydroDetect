import { useState, useEffect } from 'react';
import { deviceAPI } from '../services/api';
import { useSocketEvent } from '../hooks/useSocket';
import { MdDevicesOther, MdCircle, MdLocationOn } from 'react-icons/md';
import { motion } from 'framer-motion';

export default function DevicePanel() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await deviceAPI.getAll();
        setDevices(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch devices:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  useSocketEvent('device:status', (update) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.deviceId === update.deviceId
          ? { ...d, status: update.status, lastSeen: update.lastSeen }
          : d
      )
    );
  });

  const statusConfig = {
    online: { color: 'text-[#10B981]', bg: 'bg-emerald-50/50 border-emerald-200', badge: 'bg-emerald-50 text-[#10B981] border border-emerald-200', label: 'ONLINE' },
    offline: { color: 'text-[#EF4444]', bg: 'bg-red-50/50 border-red-200', badge: 'bg-red-50 text-[#EF4444] border border-red-200', label: 'OFFLINE' },
    disconnected: { color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200', badge: 'bg-slate-50 text-slate-600 border border-slate-200', label: 'DISCONNECTED' },
  };

  if (loading) {
    return (
      <div className="glass-card p-6 rounded-xl h-full flex items-center justify-center bg-white border border-slate-200">
        <div className="w-7 h-7 border-2 border-teal-500/20 border-t-[#2DD4BF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-xl h-full flex flex-col justify-between bg-white border border-slate-200 font-sans">
      <div>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 flex-shrink-0">
              <MdDevicesOther className="text-2xl" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-sans">Monitoring Station Grid</h2>
              <p className="text-xs text-slate-500 font-medium font-sans">Hardware Telemetry Unit</p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            {devices.filter((d) => d.status === 'online').length}/{devices.length} Online
          </span>
        </div>

        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {devices.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm font-sans font-medium">
              No monitoring devices detected.
            </div>
          ) : (
            devices.map((device, i) => {
              const cfg = statusConfig[device.status] || statusConfig.offline;
              return (
                <motion.div
                  key={device.deviceId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`p-4 rounded-xl border ${cfg.bg} transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5`}
                >
                  <div className="flex items-center gap-3">
                    <MdCircle className={`text-[10px] ${cfg.color} ${device.status === 'online' ? 'animate-pulse' : ''}`} />
                    <div className="flex-1 min-w-0 font-sans">
                      <p className="text-sm font-semibold text-slate-900 truncate">{device.name}</p>
                      <p className="text-xs text-slate-500 font-medium truncate flex items-center gap-1 mt-1">
                        <MdLocationOn className="text-slate-400 text-sm" />
                        {device.location} • <span className="font-mono font-semibold text-[#2DD4BF]">{device.deviceId}</span>
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-wider ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
