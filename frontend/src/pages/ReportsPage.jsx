import { useState } from 'react';
import { reportAPI } from '../services/api';
import { MdAssessment, MdDownload, MdPictureAsPdf } from 'react-icons/md';
import { motion } from 'framer-motion';

export default function ReportsPage() {
  const [downloading, setDownloading] = useState(null);

  const handleDownload = async (period, format) => {
    const key = `${period}-${format}`;
    setDownloading(key);
    try {
      const res = await reportAPI.download(period, format);
      const blob = new Blob([res.data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/csv',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hydrodetect_${period}_report.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to generate report. Ensure backend server is running.');
    } finally {
      setDownloading(null);
    }
  };

  const periods = [
    {
      key: 'daily',
      label: '24-Hour Daily Audit',
      desc: 'Comprehensive 24-hour compliance record including pre/post pH, TDS values, volumetric water loss %, and triggered alert incidents.',
      icon: '📊',
    },
    {
      key: 'weekly',
      label: '7-Day Weekly Compliance Summary',
      desc: 'Weekly trend analysis, effluent treatment efficiency metrics, peak volume loss events, and factory compliance ratings.',
      icon: '📈',
    },
    {
      key: 'monthly',
      label: '30-Day Monthly Environmental Audit',
      desc: 'Full regulatory compliance audit report for government water authority submission (PDF format with formatted table breakdowns).',
      icon: '📋',
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0">
          <MdAssessment className="text-xl" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Environmental Compliance Reports</h1>
          <p className="text-xs text-slate-500 font-medium">Export official PDF and CSV auditing reports for regulatory authorities</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {periods.map((period, i) => (
          <motion.div
            key={period.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-5 flex flex-col justify-between"
          >
            <div>
              <div className="text-3xl mb-3">{period.icon}</div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{period.label}</h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed font-medium">{period.desc}</p>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => handleDownload(period.key, 'pdf')}
                disabled={downloading === `${period.key}-pdf`}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100/80 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
              >
                <MdPictureAsPdf className="text-base" />
                {downloading === `${period.key}-pdf` ? 'Exporting...' : 'PDF Audit'}
              </button>
              <button
                onClick={() => handleDownload(period.key, 'csv')}
                disabled={downloading === `${period.key}-csv`}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100/80 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
              >
                <MdDownload className="text-base" />
                {downloading === `${period.key}-csv` ? 'Exporting...' : 'CSV Data'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
