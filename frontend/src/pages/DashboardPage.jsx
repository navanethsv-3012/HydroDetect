import { useState, useEffect, useCallback } from 'react';
import { analyticsAPI, readingAPI, alertAPI, deviceAPI } from '../services/api';
import { useSocketEvent } from '../hooks/useSocket';
import HardwareSessionPanel from '../components/HardwareSessionPanel';
import SystemHealthSummary from '../components/SystemHealthSummary';
import WaterQualityPanel from '../components/WaterQualityPanel';
import FlowMonitoringPanel from '../components/FlowMonitoringPanel';
import InteractiveFactoryMap from '../components/InteractiveFactoryMap';
import LiveAlertsFeed from '../components/LiveAlertsFeed';
import DevicePanel from '../components/DevicePanel';
import TrendCharts from '../charts/TrendCharts';
import { motion } from 'framer-motion';
import { MdWaterDrop, MdAssessment, MdGridView, MdAnalytics } from 'react-icons/md';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [latestReadings, setLatestReadings] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [sumRes, readRes, alertRes, devRes] = await Promise.all([
        analyticsAPI.getSummary(),
        readingAPI.getLatest(),
        alertAPI.getAll({ limit: 30 }),
        deviceAPI.getAll(),
      ]);
      setSummary(sumRes.data.data);
      setLatestReadings(readRes.data.data || []);
      setAlerts(alertRes.data.data || []);
      setDevices(devRes.data.data || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time Socket.IO Stream Handlers
  useSocketEvent('reading:new', (reading) => {
    setLatestReadings((prev) => {
      const idx = prev.findIndex((r) => r.deviceId === reading.deviceId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = reading;
        return updated;
      }
      return [reading, ...prev];
    });
  });

  useSocketEvent('alert:new', (alert) => {
    setAlerts((prev) => [alert, ...prev].slice(0, 50));
  });

  useSocketEvent('stats:update', (stats) => {
    setSummary((prev) => (prev ? { ...prev, ...stats } : stats));
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-teal-500/20 border-t-[#2DD4BF] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-mono font-medium">Connecting to Effluent Hardware Stream...</p>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-12 max-w-[1600px] mx-auto font-sans"
    >
      {/* Executive Overview Header Banner */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        {/* Left: Title block */}
        <div>
          {/* Row 1: compliance badge + station pill — two distinct chips, separated */}
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span className="px-3 py-1 rounded-full bg-teal-50 text-[#2DD4BF] text-xs font-mono font-bold tracking-wider uppercase border border-teal-200">
              INDUSTRIAL COMPLIANCE MONITORING
            </span>
            {/* Separator dot */}
            <span className="text-slate-300 text-xs select-none">•</span>
            {/* Station ID as its own pill — no longer inline plain text */}
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-mono font-semibold border border-slate-200 tracking-wide">
              STATION ID:&nbsp;ESP-DYE-001
            </span>
          </div>

          {/* Row 2: Main heading */}
          <h1 className="text-[28px] font-extrabold text-slate-900 tracking-tight font-sans leading-tight mb-1">
            Wastewater Effluent Intelligence Console
          </h1>

          {/* Row 3: Subtitle */}
          <p className="text-sm text-slate-500 font-medium font-sans">
            Real-time IoT telemetry, volumetric bypass audit, &amp; automated compliance tracking
          </p>
        </div>

        {/* Right: Status chips — each is label stacked above value, no concatenation */}
        <div className="flex items-stretch gap-3 flex-shrink-0 flex-wrap">
          {/* Active Unit chip */}
          <div className="flex flex-col justify-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 min-w-[130px]">
            <span className="text-[10px] text-slate-400 uppercase font-sans font-bold tracking-widest mb-1">
              Active Unit
            </span>
            <span className="font-bold text-slate-900 text-sm font-mono leading-tight">
              ESP-DYE-001
            </span>
          </div>

          {/* System Status chip */}
          <div className="flex flex-col justify-center bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-200 min-w-[140px]">
            <span className="text-[10px] text-slate-400 uppercase font-sans font-bold tracking-widest mb-1">
              System Status
            </span>
            <span className="font-bold inline-flex items-center gap-1.5 text-[#10B981] text-sm leading-tight">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse flex-shrink-0" />
              COMPLIANT GRID
            </span>
          </div>
        </div>
      </motion.div>

      {/* 0. Real-time Hardware Connectivity Session Panel */}
      <motion.div variants={itemVariants}>
        <HardwareSessionPanel />
      </motion.div>

      {/* 1. System KPI Overview */}
      <motion.div variants={itemVariants} className="space-y-5">
        <div className="flex items-center gap-2.5">
          <MdGridView className="text-[#2DD4BF] text-2xl flex-shrink-0" />
          <h2 className="text-[22px] font-bold text-slate-900 tracking-tight font-sans">System KPI Overview</h2>
        </div>
        <SystemHealthSummary summary={summary} />
      </motion.div>

      {/* 2. Purification & Flow Balance Analysis */}
      <motion.div variants={itemVariants} className="space-y-5">
        <div className="flex items-center gap-2.5">
          <MdWaterDrop className="text-[#2DD4BF] text-2xl flex-shrink-0" />
          <h2 className="text-[22px] font-bold text-slate-900 tracking-tight font-sans">Purification & Flow Balance Analysis</h2>
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-6">
            <WaterQualityPanel readings={latestReadings} />
          </div>
          <div className="col-span-12 xl:col-span-6">
            <FlowMonitoringPanel readings={latestReadings} />
          </div>
        </div>
      </motion.div>

      {/* 3. Industrial Monitoring Station Map */}
      <motion.div variants={itemVariants} className="space-y-5">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md bg-teal-50 border border-teal-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          </span>
          <h2 className="text-[22px] font-bold text-slate-900 tracking-tight font-sans">Industrial Monitoring Station Map</h2>
        </div>
        <InteractiveFactoryMap readings={latestReadings} devices={devices} />
      </motion.div>

      {/* 4. Telemetry Stream Analytics */}
      <motion.div variants={itemVariants} className="space-y-5">
        <div className="flex items-center gap-2.5">
          <MdAnalytics className="text-[#2DD4BF] text-2xl flex-shrink-0" />
          <h2 className="text-[22px] font-bold text-slate-900 tracking-tight font-sans">Telemetry Stream Analytics</h2>
        </div>
        <TrendCharts />
      </motion.div>

      {/* 5. Alert Operations & Station Directory */}
      <motion.div variants={itemVariants} className="space-y-5 pb-4">
        <div className="flex items-center gap-2.5">
          <MdAssessment className="text-[#2DD4BF] text-2xl flex-shrink-0" />
          <h2 className="text-[22px] font-bold text-slate-900 tracking-tight font-sans">Alert Operations & Station Directory</h2>
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-6">
            <LiveAlertsFeed alerts={alerts} />
          </div>
          <div className="col-span-12 xl:col-span-6">
            <DevicePanel />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
