import { MdScience } from 'react-icons/md';

const getPhStatus = (ph) => {
  if (ph === null || ph === undefined) return { label: 'N/A', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200' };
  if (ph >= 6.5 && ph <= 8.5) return { label: 'Compliant', badgeClass: 'bg-emerald-50 text-[#10B981] border-emerald-200' };
  if (ph >= 6.0 && ph <= 9.0) return { label: 'Warning', badgeClass: 'bg-amber-50 text-[#F59E0B] border-amber-200' };
  return { label: 'Violation', badgeClass: 'bg-red-50 text-[#EF4444] border-red-200' };
};

const getTdsStatus = (tds) => {
  if (tds === null || tds === undefined) return { label: 'N/A', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200' };
  if (tds <= 500) return { label: 'Compliant', badgeClass: 'bg-emerald-50 text-[#10B981] border-emerald-200' };
  if (tds <= 600) return { label: 'Warning', badgeClass: 'bg-amber-50 text-[#F59E0B] border-amber-200' };
  return { label: 'Violation', badgeClass: 'bg-red-50 text-[#EF4444] border-red-200' };
};

export default function WaterQualityPanel({ readings = [] }) {
  const reading = readings[0] || {};

  const phStatus = getPhStatus(reading.ph_post);
  const tdsStatus = getTdsStatus(reading.tds_post);

  const tdsEfficiency = reading.tds_pre > 0
    ? ((reading.tds_pre - reading.tds_post) / reading.tds_pre * 100).toFixed(1)
    : null;

  const phPercent = reading.ph_post
    ? Math.max(0, Math.min(100, ((reading.ph_post - 4.0) / (10.0 - 4.0)) * 100))
    : 50;

  return (
    <div className="glass-card p-6 rounded-[10px] h-full flex flex-col justify-between bg-white border border-slate-200">
      <div>
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#2DD4BF] flex-shrink-0">
              <MdScience className="text-2xl" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight font-sans" style={{ lineHeight: '1.3' }}>Water Quality Analysis</h2>
              <p className="text-xs text-slate-500 font-medium font-sans" style={{ marginTop: '5px', lineHeight: '1.6' }}>Pre vs Post Purification Parameters</p>
            </div>
          </div>
          {reading.deviceId && (
            <span className="px-3 py-1 rounded-[10px] bg-slate-50 text-slate-700 font-mono text-xs font-semibold border border-slate-200">
              {reading.deviceId}
            </span>
          )}
        </div>

        {/* Visual pH Compliance Scale */}
        <div className="mb-7 p-5 rounded-[10px] bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-xs mb-3 font-semibold font-sans" style={{ lineHeight: '1.6' }}>
            <span className="text-slate-700">pH Compliance Gauge (Regulatory: 6.5 – 8.5)</span>
            <span className="font-mono text-xs text-slate-900 bg-white px-2 py-0.5 rounded-[10px] border border-slate-200 font-bold">
              Post: pH {reading.ph_post ?? '—'}
            </span>
          </div>

          <div className="relative h-3.5 w-full bg-slate-200 rounded-full overflow-hidden mb-3 border border-slate-200">
            {/* Acidic Risk Zone */}
            <div className="absolute left-0 top-0 bottom-0 w-[41.6%] bg-red-100" />
            {/* Safe Compliant Green Zone */}
            <div className="absolute left-[41.6%] right-[25%] top-0 bottom-0 bg-emerald-200 border-x border-emerald-400" />
            {/* Alkaline Risk Zone */}
            <div className="absolute right-0 top-0 bottom-0 w-[25%] bg-red-100" />

            {/* Current pH Indicator Pointer */}
            {reading.ph_post && (
              <div
                className="absolute top-0 bottom-0 w-3 -ml-1.5 bg-slate-900 rounded-full shadow-xs transition-all duration-500 border-2 border-white"
                style={{ left: `${phPercent}%` }}
              />
            )}
          </div>

          <div className="flex justify-between text-[11px] text-slate-500 font-mono font-medium">
            <span>4.0 Acidic</span>
            <span className="text-[#10B981] font-semibold">6.5 Min</span>
            <span className="text-[#10B981] font-semibold">8.5 Max</span>
            <span>10.0 Alkaline</span>
          </div>
        </div>

        {/* Detailed Metrics List — 24px gap between each card */}
        <div className="space-y-6">
          {/* pH Row */}
          <div className="p-5 rounded-[10px] bg-white border border-slate-200 flex items-center justify-between shadow-xs" style={{ lineHeight: '1.6' }}>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider font-sans" style={{ lineHeight: '1.5', marginBottom: '6px' }}>pH Level</span>
              <div className="flex items-center gap-3 font-mono text-xs" style={{ lineHeight: '1.6' }}>
                <span className="text-slate-500">Pre: <strong className="text-slate-800">{reading.ph_pre ?? '—'}</strong></span>
                <span className="text-slate-300">→</span>
                <span className="text-slate-900 font-bold">Post: {reading.ph_post ?? '—'}</span>
              </div>
            </div>
            <div className="text-right font-sans">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold border ${phStatus.badgeClass}`}>
                {phStatus.label}
              </span>
              <span className="block text-[10px] text-slate-400 font-mono font-medium" style={{ marginTop: '6px', lineHeight: '1.5' }}>
                Delta: {reading.ph_delta !== undefined ? (reading.ph_delta > 0 ? `-${reading.ph_delta}` : `+${Math.abs(reading.ph_delta)}`) : '—'}
              </span>
            </div>
          </div>

          {/* TDS Row */}
          <div className="p-5 rounded-[10px] bg-white border border-slate-200 flex items-center justify-between shadow-xs" style={{ lineHeight: '1.6' }}>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider font-sans" style={{ lineHeight: '1.5', marginBottom: '6px' }}>Total Dissolved Solids (TDS)</span>
              <div className="flex items-center gap-3 font-mono text-xs" style={{ lineHeight: '1.6' }}>
                <span className="text-slate-500">Pre: <strong className="text-slate-800">{reading.tds_pre ?? '—'} mg/L</strong></span>
                <span className="text-slate-300">→</span>
                <span className="text-slate-900 font-bold">Post: {reading.tds_post ?? '—'} mg/L</span>
              </div>
            </div>
            <div className="text-right font-sans">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold border ${tdsStatus.badgeClass}`}>
                {tdsStatus.label}
              </span>
              <span className="block text-[10px] text-slate-400 font-mono font-medium" style={{ marginTop: '6px', lineHeight: '1.5' }}>
                Limit: 500 mg/L
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TDS Efficiency Gauge Bar */}
      {tdsEfficiency !== null && (
        <div className="mt-8 pt-5 border-t border-slate-200">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 font-sans">TDS Purification Efficiency</p>
          <div className="flex items-center justify-between text-xs mb-3 font-semibold font-sans" style={{ lineHeight: '1.6' }}>
            <span className="text-slate-700">Removal Rate</span>
            <span className="font-mono text-xs text-[#2DD4BF] font-bold">{tdsEfficiency}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-[#2DD4BF] rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(0, tdsEfficiency))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
