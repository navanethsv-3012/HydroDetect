import { motion } from 'framer-motion';
import {
  MdDevices, MdCloudDone, MdCloudOff,
  MdWarning, MdSpeed, MdWaterDrop
} from 'react-icons/md';

const StatCard = ({ icon: Icon, label, value, sublabel, iconBg, iconColor, accentClass, isCritical }) => (
  <div className={`h-full p-6 rounded-xl bg-white border flex flex-col items-center justify-between text-center transition-all duration-200 ${accentClass} ${isCritical ? 'border-[#EF4444]/40 bg-red-50/20' : 'border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md'}`}>
    {/* Icon Top-Center */}
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mb-4 mx-auto ${iconBg} ${iconColor}`}>
      <Icon className="text-2xl" />
    </div>

    <div className="w-full">
      {/* Value below icon (30-36px scale) */}
      <p className="text-3xl font-extrabold font-mono text-slate-900 tracking-tight leading-none mb-2">{value ?? '—'}</p>
      {/* Label below number (14-16px scale) */}
      <p className="text-sm font-semibold text-slate-700 truncate font-sans">{label}</p>
      {sublabel && <p className="text-xs text-slate-500 font-mono font-medium truncate mt-1">{sublabel}</p>}
    </div>
  </div>
);

export default function SystemHealthSummary({ summary }) {
  if (!summary) return null;

  const cards = [
    {
      icon: MdDevices,
      label: 'Monitoring Stations',
      value: summary.devices?.total ?? 1,
      sublabel: `${summary.devices?.online ?? 1} active station`,
      iconBg: 'bg-teal-50 border border-teal-100',
      iconColor: 'text-[#2DD4BF]',
      accentClass: 'card-accent-teal',
    },
    {
      icon: MdCloudDone,
      label: 'Hardware Status',
      value: summary.devices?.online ?? 1,
      sublabel: 'ESP-DYE-001 Connected',
      iconBg: 'bg-emerald-50 border border-emerald-100',
      iconColor: 'text-[#10B981]',
      accentClass: 'card-accent-emerald',
    },
    {
      icon: MdSpeed,
      label: 'Telemetry Packets',
      value: (summary.readings?.total ?? 0).toLocaleString(),
      sublabel: 'Persisted in storage',
      iconBg: 'bg-sky-50 border border-sky-100',
      iconColor: 'text-sky-600',
      accentClass: 'card-accent-sky',
    },
    {
      icon: MdWarning,
      label: 'Critical Bypass Alerts',
      value: summary.alerts?.critical ?? 0,
      sublabel: `${summary.alerts?.total ?? 0} total events`,
      iconBg: summary.alerts?.critical > 0 ? 'bg-red-50 border border-red-100' : 'bg-slate-50 border border-slate-100',
      iconColor: summary.alerts?.critical > 0 ? 'text-[#EF4444]' : 'text-slate-500',
      accentClass: 'card-accent-red',
      isCritical: summary.alerts?.critical > 0,
    },
    {
      icon: MdWaterDrop,
      label: 'Avg Effluent pH',
      value: summary.averages?.ph_post ?? '—',
      sublabel: summary.averages?.ph_post >= 6.5 && summary.averages?.ph_post <= 8.5 ? 'Compliant (6.5-8.5)' : 'Out of Range',
      iconBg: 'bg-indigo-50 border border-indigo-100',
      iconColor: 'text-indigo-600',
      accentClass: 'card-accent-indigo',
    },
    {
      icon: MdCloudOff,
      label: 'Avg Water Loss',
      value: `${summary.averages?.water_loss_percent ?? 0}%`,
      sublabel: summary.averages?.water_loss_percent > 15 ? 'Exceeds 15% Limit' : 'Normal loss rate',
      iconBg: summary.averages?.water_loss_percent > 15 ? 'bg-amber-50 border border-amber-100' : 'bg-teal-50 border border-teal-100',
      iconColor: summary.averages?.water_loss_percent > 15 ? 'text-[#F59E0B]' : 'text-[#2DD4BF]',
      accentClass: 'card-accent-amber',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 items-stretch">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03, duration: 0.25 }}
          className="h-full"
        >
          <StatCard {...card} />
        </motion.div>
      ))}
    </div>
  );
}
