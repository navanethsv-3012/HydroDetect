import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdDashboard, MdTableChart, MdNotificationsActive,
  MdAssessment, MdDevicesOther, MdMenu, MdClose,
  MdLogout, MdPerson, MdShield, MdSensors
} from 'react-icons/md';
import { IoWater } from 'react-icons/io5';

const navSections = [
  {
    label: 'Monitoring',
    items: [
      { path: '/', label: 'Overview', icon: MdDashboard },
      { path: '/readings', label: 'Telemetry Stream', icon: MdTableChart },
      { path: '/alerts', label: 'Compliance Alerts', icon: MdNotificationsActive },
    ],
  },
  {
    label: 'Hardware',
    items: [
      { path: '/devices', label: 'Hardware Units', icon: MdDevicesOther },
    ],
  },
  {
    label: 'Reports',
    items: [
      { path: '/reports', label: 'PDF & CSV Reports', icon: MdAssessment },
    ],
  },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [uptime, setUptime] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => setUptime((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div
      className="flex flex-col h-full text-slate-200 font-sans"
      style={{
        background: 'linear-gradient(180deg, #0f1c2e 0%, #111827 55%, #0d1520 100%)',
        borderRight: '1px solid rgba(30,41,59,0.8)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.35)',
      }}
    >
      {/* Brand Logo */}
      <div
        className="flex items-center gap-3 p-5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(30,41,59,0.9)' }}
      >
        <div className="w-10 h-10 rounded-xl bg-[#2DD4BF] flex items-center justify-center text-slate-950 flex-shrink-0 shadow-md font-bold">
          <IoWater className="text-2xl" />
        </div>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="overflow-hidden"
          >
            <h1 className="text-base font-bold text-white tracking-tight font-sans">HydroDetect</h1>
            <p className="text-[10px] text-[#2DD4BF] font-mono tracking-wider uppercase font-semibold">Industrial SCADA Grid</p>
          </motion.div>
        )}
      </div>

      {/* Navigation Links — Grouped Sections */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {navSections.map((section, sIdx) => (
          <div key={section.label} className={sIdx > 0 ? 'mt-5' : ''}>
            {/* Section Label */}
            {sidebarOpen && (
              <p
                className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] font-sans"
                style={{ color: 'rgba(148,163,184,0.55)' }}
              >
                {section.label}
              </p>
            )}
            {!sidebarOpen && sIdx > 0 && (
              <div className="mx-3 mb-3" style={{ borderTop: '1px solid rgba(30,41,59,0.7)' }} />
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    [
                      'group relative flex items-center gap-2.5 px-3 rounded-lg text-sm transition-all duration-200',
                      sidebarOpen ? 'py-3' : 'py-3.5 justify-center',
                      isActive
                        ? 'bg-[#2DD4BF]/10 text-white font-bold'
                        : 'text-slate-400 font-medium hover:bg-white/5 hover:text-slate-100',
                    ].join(' ')
                  }
                  style={({ isActive }) => ({
                    borderLeft: isActive ? '3px solid #2DD4BF' : '3px solid transparent',
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={`text-xl flex-shrink-0 transition-colors duration-200 ${
                          isActive ? 'text-[#2DD4BF]' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      />
                      {sidebarOpen && <span className="truncate">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Info Footer */}
      <div
        className="p-4 flex-shrink-0"
        style={{
          borderTop: '1px solid rgba(30,41,59,0.9)',
          background: 'rgba(8,15,25,0.6)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-[#2DD4BF] font-bold flex-shrink-0">
            <MdPerson className="text-xl" />
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'Operator'}</p>
              <span className="inline-flex items-center gap-1 text-[10px] text-[#2DD4BF] font-mono uppercase font-semibold bg-teal-950/80 px-2 py-0.5 rounded-md border border-teal-800/60">
                <MdShield className="text-[10px]" /> {user?.role || 'operator'}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-[#EF4444] hover:bg-red-950/50 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <MdLogout className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F6F8] text-slate-800 font-sans">
      {/* Desktop Sidebar (Fixed 250px) */}
      <motion.aside
        animate={{ width: sidebarOpen ? 256 : 72 }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="hidden lg:flex flex-col overflow-hidden flex-shrink-0 z-30"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-[250px] z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Fixed Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center px-6 gap-6 flex-shrink-0 z-20 shadow-xs sticky top-0">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) setMobileOpen(!mobileOpen);
              else setSidebarOpen(!sidebarOpen);
            }}
            className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
          >
            {mobileOpen ? <MdClose className="text-xl" /> : <MdMenu className="text-xl" />}
          </button>

          <div className="flex items-center gap-3 text-sm font-mono text-slate-700 font-semibold hidden sm:flex">
            <MdSensors className="text-[#2DD4BF] text-xl flex-shrink-0" />
            <span className="truncate">HydroDetect SCADA Grid • Station: ESP-DYE-001</span>
          </div>

          <div className="flex-1" />

          {/* Real-time Status Badges with Equal Spacing */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 font-semibold">
              <span className="text-slate-400 uppercase font-sans text-[11px]">Uptime:</span>
              <span>{formatUptime(uptime)}</span>
            </div>

            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 text-xs font-mono text-[#10B981] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>Socket.IO Live</span>
            </div>
          </div>
        </header>

        {/* Page Content Canvas */}
        <main className="flex-1 overflow-y-auto p-8 md:p-10 bg-[#F5F6F8] min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
