import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { IoWater } from 'react-icons/io5';
import { MdEmail, MdLock, MdPerson, MdVisibility, MdVisibilityOff, MdAutoAwesome } from 'react-icons/md';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleDemoFill = () => {
    setEmail('admin@aquasentinel.com');
    setPassword('admin123');
    setIsRegister(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(name, email, password, 'admin');
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      if (!err.response) {
        setError('Unable to reach backend server (http://localhost:5005). Please ensure backend is running.');
      } else {
        setError(
          err.response.data?.error ||
          err.response.data?.message ||
          err.response.data?.messages?.[0] ||
          'Authentication failed. Invalid email or password.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA] p-4 relative overflow-hidden">
      {/* Soft Background Accent */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-600 flex items-center justify-center shadow-md mb-3 text-white">
            <IoWater className="text-2xl" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight font-sans">HydroDetect FSD</h1>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">Wastewater Compliance Intelligence Platform</p>
        </div>

        {/* Form Container */}
        <div className="glass-card p-7 shadow-xs bg-white border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-slate-900">
              {isRegister ? 'Create Account' : 'Sign In to Console'}
            </h2>

            <button
              type="button"
              onClick={handleDemoFill}
              className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 hover:bg-teal-100/80 transition-colors cursor-pointer"
            >
              <MdAutoAwesome className="text-teal-600" /> Auto-fill Demo
            </button>
          </div>

          {!isRegister && (
            <div className="mb-5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-sans flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">Default Demo Credentials:</span>
                <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                  admin@aquasentinel.com / admin123
                </div>
              </div>
              <button
                type="button"
                onClick={handleDemoFill}
                className="text-xs font-semibold text-teal-600 hover:underline cursor-pointer"
              >
                Use
              </button>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-mono font-semibold"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Full Name</label>
                <div className="relative">
                  <span className="input-icon-left"><MdPerson /></span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="field-with-icon font-mono"
                    placeholder="System Operator"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Email Address</label>
              <div className="relative">
                <span className="input-icon-left"><MdEmail /></span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field-with-icon font-mono"
                  placeholder="admin@aquasentinel.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Password</label>
              <div className="relative">
                <span className="input-icon-left"><MdLock /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field-with-icon has-right-icon font-mono"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="input-icon-right-btn"
                >
                  {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs transition-colors disabled:opacity-50 text-xs uppercase tracking-wider mt-2 cursor-pointer"
            >
              {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Authenticate Console'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500 font-medium">
            {isRegister ? 'Already have an authorized account?' : 'Need an account?'}
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="ml-1 text-teal-700 font-semibold hover:text-teal-800 transition-colors cursor-pointer"
            >
              {isRegister ? 'Sign In' : 'Register Operator'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
