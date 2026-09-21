import { useState, useEffect } from 'react';
import { alertAPI } from '../services/api';
import { useSocketEvent } from '../hooks/useSocket';
import { MdNotificationsActive, MdCheckCircle, MdMarkEmailRead } from 'react-icons/md';
import { motion } from 'framer-motion';

const severityStyles = {
  Critical: { bg: 'bg-red-50/40 border-red-200/80', text: 'text-red-700', badge: 'bg-red-50 text-red-700 border border-red-200', dot: 'bg-red-500' },
  High: { bg: 'bg-amber-50/40 border-amber-200/80', text: 'text-amber-700', badge: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500' },
  Medium: { bg: 'bg-amber-50/20 border-amber-200/60', text: 'text-amber-700', badge: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500' },
  Low: { bg: 'bg-emerald-50/40 border-emerald-200/80', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const params = { limit: 100 };
      if (filter) params.severity = filter;
      const [alertRes, sumRes] = await Promise.all([
        alertAPI.getAll(params),
        alertAPI.getSummary(),
      ]);
      setAlerts(alertRes.data.data || []);
      setSummary(sumRes.data.data);
    } catch (err) {
      console.error('Alerts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  useSocketEvent('alert:new', (alert) => {
    setAlerts((prev) => [alert, ...prev]);
  });

  const handleAcknowledge = async (id) => {
    try {
      await alertAPI.acknowledge(id);
      setAlerts((prev) =>
        prev.map((a) => (a._id === id ? { ...a, acknowledged: true } : a))
      );
    } catch (err) {
      console.error('Acknowledge error:', err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
          <MdNotificationsActive className="text-xl" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Central Compliance Alert Station</h1>
          <p className="text-xs text-slate-500 font-medium">Automated Effluent Violations & SMTP Dispatch Log</p>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Critical', 'High', 'Medium', 'Low'].map((sev) => {
            const cfg = severityStyles[sev];
            const data = summary[sev] || { total: 0, unacknowledged: 0 };
            return (
              <button
                key={sev}
                onClick={() => setFilter(filter === sev ? '' : sev)}
                className={`glass-card p-4 text-left transition-all cursor-pointer ${
                  filter === sev ? `border-teal-500 ring-2 ring-teal-500/20` : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono font-semibold tracking-wider uppercase ${cfg.text}`}>{sev}</span>
                  {data.unacknowledged > 0 && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </div>
                <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{data.total}</p>
                <p className="text-[10px] font-mono text-slate-500 mt-0.5 font-medium">{data.unacknowledged} Pending Ack</p>
              </button>
            );
          })}
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="space-y-0 max-h-[600px] overflow-y-auto divide-y divide-slate-100">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-2 border-red-500/20 border-t-red-600 rounded-full animate-spin" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-mono text-xs font-medium">No alert events match current criteria.</div>
          ) : (
            alerts.map((alert) => {
              const cfg = severityStyles[alert.severity] || severityStyles.Low;
              return (
                <div
                  key={alert._id}
                  className={`p-4 flex items-start gap-3.5 transition-colors ${alert.acknowledged ? 'opacity-40 grayscale' : cfg.bg}`}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot} ${!alert.acknowledged ? 'animate-pulse' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wider uppercase ${cfg.badge}`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs font-mono text-teal-700 font-semibold">{alert.deviceId}</span>
                      {alert.emailSent && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-teal-700 font-mono bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 font-medium">
                          <MdMarkEmailRead /> SMTP Sent
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-400 ml-auto font-medium">
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed font-sans">{alert.message}</p>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => handleAcknowledge(alert._id)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-300 transition-colors flex-shrink-0 shadow-xs cursor-pointer"
                      title="Acknowledge Alert"
                    >
                      <MdCheckCircle className="text-base" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}
