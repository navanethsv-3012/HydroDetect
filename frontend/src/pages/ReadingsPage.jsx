import { useState, useEffect, useCallback } from 'react';
import { readingAPI } from '../services/api';
import { useSocketEvent } from '../hooks/useSocket';
import { MdTableChart, MdSearch, MdDownload, MdNavigateBefore, MdNavigateNext, MdRefresh } from 'react-icons/md';
import { motion } from 'framer-motion';

export default function ReadingsPage() {
  const [readings, setReadings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(25);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('timestamp');
  const [sortDir, setSortDir] = useState('desc');
  const [loading, setLoading] = useState(true);

  const fetchReadings = useCallback(async () => {
    try {
      setLoading(true);
      const sort = `${sortDir === 'desc' ? '-' : ''}${sortField}`;
      const params = { page, limit, sort };
      if (search) params.deviceId = search;
      const res = await readingAPI.getAll(params);
      setReadings(res.data.data || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      console.error('Readings fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, sortField, sortDir]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  useSocketEvent('reading:new', () => {
    if (page === 1) fetchReadings();
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-slate-300 ml-1">↕</span>;
    return <span className="text-teal-700 ml-1 font-bold">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Device ID', 'pH Pre', 'pH Post', 'TDS Pre', 'TDS Post', 'Flow Inlet', 'Flow Outlet', 'Water Loss', 'Water Loss %'];
    const rows = readings.map((r) => [
      new Date(r.timestamp).toISOString(),
      r.deviceId, r.ph_pre, r.ph_post, r.tds_pre, r.tds_post,
      r.flow_inlet, r.flow_outlet, r.water_loss, r.water_loss_percent,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hydrodetect_telemetry_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0">
            <MdTableChart className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Telemetry Stream & Data Logs</h1>
            <p className="text-xs text-slate-500 font-medium">Paginated hardware sensor logs with pre/post treatment parameters</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search Device ID..."
              className="pl-8.5 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:border-teal-500 outline-none w-48 font-mono font-semibold shadow-xs"
            />
          </div>
          <button
            onClick={fetchReadings}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-xs cursor-pointer"
            title="Refresh Data"
          >
            <MdRefresh className="text-base" />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs cursor-pointer"
          >
            <MdDownload className="text-base" /> CSV Export
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {[
                  { key: 'timestamp', label: 'Timestamp' },
                  { key: 'deviceId', label: 'Device ID' },
                  { key: 'ph_pre', label: 'pH Pre' },
                  { key: 'ph_post', label: 'pH Post' },
                  { key: 'tds_pre', label: 'TDS Pre' },
                  { key: 'tds_post', label: 'TDS Post' },
                  { key: 'flow_inlet', label: 'Flow In' },
                  { key: 'flow_outlet', label: 'Flow Out' },
                  { key: 'water_loss', label: 'Water Loss' },
                  { key: 'water_loss_percent', label: 'Loss %' },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="px-4 py-3 text-left font-mono font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-teal-700 select-none whitespace-nowrap"
                  >
                    {label}<SortIcon field={key} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-slate-400 font-medium">
                    <div className="w-6 h-6 border-2 border-teal-500/20 border-t-teal-600 rounded-full animate-spin mx-auto mb-2" />
                    Loading telemetry records...
                  </td>
                </tr>
              ) : readings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-slate-400 text-xs font-medium">
                    No telemetry records found.
                  </td>
                </tr>
              ) : (
                readings.map((r) => {
                  const isViolation = r.water_loss_percent > 15 || r.ph_post < 6.5 || r.ph_post > 8.5 || r.tds_post > 500;
                  const isWarning = r.water_loss_percent > 5 || r.tds_post > 400;

                  return (
                    <tr
                      key={r._id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isViolation ? 'bg-red-50/40' : isWarning ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                        {new Date(r.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-teal-700 whitespace-nowrap">{r.deviceId}</td>
                      <td className="px-4 py-2.5 text-slate-500">{r.ph_pre}</td>
                      <td className={`px-4 py-2.5 font-bold ${r.ph_post < 6.5 || r.ph_post > 8.5 ? 'text-red-700' : 'text-slate-800'}`}>{r.ph_post}</td>
                      <td className="px-4 py-2.5 text-slate-500">{r.tds_pre}</td>
                      <td className={`px-4 py-2.5 font-bold ${r.tds_post > 500 ? 'text-red-700' : 'text-slate-800'}`}>{r.tds_post}</td>
                      <td className="px-4 py-2.5 text-slate-700">{r.flow_inlet?.toLocaleString()} L</td>
                      <td className="px-4 py-2.5 text-slate-700">{r.flow_outlet?.toLocaleString()} L</td>
                      <td className="px-4 py-2.5 text-slate-700">{r.water_loss?.toFixed(0)} L</td>
                      <td className={`px-4 py-2.5 font-bold ${r.water_loss_percent > 15 ? 'text-red-700' : r.water_loss_percent > 5 ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {r.water_loss_percent}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/60 font-mono text-xs text-slate-500 font-medium">
          <p>
            Records {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors shadow-xs cursor-pointer"
            >
              <MdNavigateBefore className="text-base" />
            </button>
            <span>
              Page {page} / {pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors shadow-xs cursor-pointer"
            >
              <MdNavigateNext className="text-base" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
