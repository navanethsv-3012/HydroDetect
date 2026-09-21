import { MdWaves, MdWarningAmber } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';

export default function FlowMonitoringPanel({ readings = [] }) {
  const reading = readings[0] || {};

  const hasBypass = reading.water_loss_percent > 15;

  const getLossColor = (pct) => {
    if (pct > 15) return 'text-[#EF4444]';
    if (pct > 5) return 'text-[#F59E0B]';
    return 'text-[#10B981]';
  };

  const getLossBarBg = (pct) => {
    if (pct > 15) return 'bg-[#EF4444]';
    if (pct > 5) return 'bg-[#F59E0B]';
    return 'bg-[#10B981]';
  };

  return (
    <div className={`glass-card p-6 rounded-xl h-full flex flex-col justify-between bg-white border ${hasBypass ? 'border-red-200 bg-red-50/10' : 'border-slate-200'}`}>
      <div>
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 flex-shrink-0">
              <MdWaves className="text-2xl" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight font-sans" style={{ lineHeight: '1.3' }}>Flow Telemetry & Water Loss</h2>
              <p className="text-xs text-slate-500 font-medium font-sans" style={{ marginTop: '4px', lineHeight: '1.6' }}>Effluent Volumetric Balance & Bypass Detection</p>
            </div>
          </div>
          {reading.deviceId && (
            <span className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 font-mono text-xs font-semibold border border-slate-200">
              {reading.deviceId}
            </span>
          )}
        </div>

        {/* Bypass Warning Banner */}
        <AnimatePresence>
          {hasBypass && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center flex-shrink-0 text-[#EF4444]">
                  <MdWarningAmber className="text-xl" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-[#EF4444] uppercase tracking-wider font-sans">UNTREATED WATER BYPASS ALERT</p>
                    <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-[#EF4444] text-xs font-semibold uppercase border border-red-200 font-sans">CRITICAL</span>
                  </div>
                  <p className="text-slate-700 text-sm mt-1 font-medium leading-relaxed font-sans">
                    Volumetric water loss at <strong className="font-mono text-[#EF4444] font-bold">{reading.water_loss_percent}%</strong> ({reading.water_loss} L) — exceeds 15% limit.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fluid Pipeline Flow Visualization */}
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 mb-8">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-4 font-sans">
            <span>Primary Inlet Station</span>
            <span className="text-[#2DD4BF] font-mono font-bold">Purification Unit</span>
            <span>Secondary Outlet Station</span>
          </div>

          <div className="relative flex items-center justify-between gap-4">
            {/* Inlet Box */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 text-center flex-1 shadow-xs font-sans">
              <span className="text-xs text-slate-400 block uppercase font-semibold mb-1">Inlet Volume</span>
              <span className="text-lg font-bold font-mono text-slate-900">
                {reading.flow_inlet?.toLocaleString() ?? '—'} <span className="text-xs text-slate-400 font-normal">L</span>
              </span>
            </div>

            {/* Flow Vector Pipes */}
            <div className="flex-1 flex items-center justify-center relative h-6">
              <svg className="w-full h-3" viewBox="0 0 100 16">
                <line x1="0" y1="8" x2="100" y2="8" stroke="#cbd5e1" strokeWidth="4" />
                <line x1="0" y1="8" x2="100" y2="8" stroke="#2DD4BF" strokeWidth="4" className="flow-dash" />
              </svg>
            </div>

            {/* Outlet Box */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 text-center flex-1 shadow-xs font-sans">
              <span className="text-xs text-slate-400 block uppercase font-semibold mb-1">Outlet Volume</span>
              <span className="text-lg font-bold font-mono text-[#2DD4BF]">
                {reading.flow_outlet?.toLocaleString() ?? '—'} <span className="text-xs text-slate-400 font-normal">L</span>
              </span>
            </div>
          </div>
        </div>

        {/* Water Loss Gauge Card — clearly separated from pipeline block above */}
        <div className="p-5 rounded-xl border" style={{ background: '#f8fafc', borderColor: '#e2e8f0', borderTopWidth: '2px', borderTopColor: '#e2e8f0' }}>
          {/* Section label */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 font-sans">Volumetric Water Loss</p>

          <div className="flex items-center justify-between mb-4 font-semibold font-sans">
            <span className="text-sm text-slate-700" style={{ lineHeight: '1.5' }}>Water Loss Volume</span>
            <div className="flex items-center gap-2 font-mono text-sm">
              <span className="text-slate-600">{reading.water_loss?.toLocaleString() ?? '—'} L</span>
              <span className={`font-bold ${getLossColor(reading.water_loss_percent)}`}>
                ({reading.water_loss_percent ?? 0}%)
              </span>
            </div>
          </div>

          <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden mb-4 relative">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getLossBarBg(reading.water_loss_percent)}`}
              style={{ width: `${Math.min(100, Math.max(0, reading.water_loss_percent || 0))}%` }}
            />
          </div>

          <div className="flex justify-between text-xs font-mono text-slate-500 font-medium" style={{ lineHeight: '1.5' }}>
            <span>0% Normal</span>
            <span className="text-[#F59E0B] font-semibold">5% Warning</span>
            <span className="text-[#EF4444] font-semibold">15% Critical Limit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
