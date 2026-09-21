import { useState } from 'react';
import { MdNotificationsActive, MdCheckCircle, MdMarkEmailRead } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import { alertAPI } from '../services/api';

const severityStyles = {
  Critical: { bg: 'bg-red-50/50 border-red-200', text: 'text-[#EF4444]', badge: 'bg-red-50 text-[#EF4444] border border-red-200', dot: 'bg-[#EF4444]' },
  High: { bg: 'bg-amber-50/50 border-amber-200', text: 'text-[#F59E0B]', badge: 'bg-amber-50 text-[#F59E0B] border border-amber-200', dot: 'bg-[#F59E0B]' },
  Medium: { bg: 'bg-amber-50/30 border-amber-200/60', text: 'text-[#F59E0B]', badge: 'bg-amber-50 text-[#F59E0B] border border-amber-200', dot: 'bg-[#F59E0B]' },
  Low: { bg: 'bg-emerald-50/50 border-emerald-200', text: 'text-[#10B981]', badge: 'bg-emerald-50 text-[#10B981] border border-emerald-200', dot: 'bg-[#10B981]' },
};

export default function LiveAlertsFeed({ alerts = [] }) {
  const [filter, setFilter] = useState('ALL');
  const [acknowledging, setAcknowledging] = useState(null);

  const handleAcknowledge = async (alertId) => {
    try {
      setAcknowledging(alertId);
      await alertAPI.acknowledge(alertId);
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    } finally {
      setAcknowledging(null);
    }
  };

  const filteredAlerts = filter === 'ALL'
    ? alerts
    : alerts.filter((a) => a.severity.toUpperCase() === filter);

  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="glass-card p-6 rounded-xl h-full flex flex-col bg-white border border-slate-200 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-[#EF4444] flex-shrink-0">
            <MdNotificationsActive className="text-2xl" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5 font-sans">
              Live Alert Console
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-pulse" />
            </h2>
            <p className="text-xs text-slate-500 font-medium font-sans">Compliance Violations & Bypass Stream</p>
          </div>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-1 text-xs font-sans font-semibold">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilter(sev)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === sev ? 'bg-white text-[#2DD4BF] font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
        <AnimatePresence initial={false}>
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm font-sans font-medium">
              ✓ No active alerts matching filter criteria. System running within compliance thresholds.
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const cfg = severityStyles[alert.severity] || severityStyles.Low;
              return (
                <motion.div
                  key={alert._id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  className={`p-4 rounded-xl border ${cfg.bg} ${alert.acknowledged ? 'opacity-40 grayscale' : ''} transition-all shadow-xs hover:shadow-sm`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot} ${!alert.acknowledged ? 'animate-pulse' : ''}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase font-sans ${cfg.badge}`}>
                          {alert.severity}
                        </span>
                        <span className="text-xs font-mono font-semibold text-slate-700">{alert.deviceId}</span>
                        {alert.emailSent && (
                          <span className="inline-flex items-center gap-1 text-xs text-[#2DD4BF] font-mono bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 font-medium">
                            <MdMarkEmailRead /> SMTP Sent
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono ml-auto font-medium">{formatTime(alert.createdAt)}</span>
                      </div>

                      <p className="text-sm text-slate-700 font-medium leading-relaxed font-sans">{alert.message}</p>
                    </div>

                    {!alert.acknowledged && (
                      <button
                        onClick={() => handleAcknowledge(alert._id)}
                        disabled={acknowledging === alert._id}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-[#10B981] hover:bg-emerald-50 transition-colors flex-shrink-0 cursor-pointer"
                        title="Acknowledge Alert"
                      >
                        <MdCheckCircle className="text-lg" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
