import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5005';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aquasentinel_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('aquasentinel_token');
      localStorage.removeItem('aquasentinel_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// ─── Devices ────────────────────────────────────────────────
export const deviceAPI = {
  getAll: (params) => api.get('/devices', { params }),
  getOne: (id) => api.get(`/devices/${id}`),
  create: (data) => api.post('/devices', data),
  update: (id, data) => api.put(`/devices/${id}`, data),
  delete: (id) => api.delete(`/devices/${id}`),
};

// ─── Readings ───────────────────────────────────────────────
export const readingAPI = {
  getAll: (params) => api.get('/readings', { params }),
  getLatest: (params) => api.get('/readings/latest', { params }),
  getTrends: (params) => api.get('/readings/trends', { params }),
};

// ─── Alerts ─────────────────────────────────────────────────
export const alertAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  getSummary: () => api.get('/alerts/summary'),
  acknowledge: (id) => api.put(`/alerts/${id}/acknowledge`),
};

// ─── Analytics ──────────────────────────────────────────────
export const analyticsAPI = {
  getSummary: () => api.get('/analytics/summary'),
  getTrends: (params) => api.get('/analytics/trends', { params }),
  getEfficiency: () => api.get('/analytics/efficiency'),
};

// ─── Reports ────────────────────────────────────────────────
export const reportAPI = {
  download: (period, format = 'pdf') =>
    api.get(`/reports/${period}`, {
      params: { format },
      responseType: 'blob',
    }),
  getData: (period) => api.get(`/reports/${period}/data`),
};

// ─── Hardware / Serial ──────────────────────────────────────
export const hardwareAPI = {
  getSession: () => api.get('/hardware/session'),
  listPorts: () => api.get('/hardware/ports'),
  setMode: (data) => api.post('/hardware/mode', data),
  connect: (data) => api.post('/hardware/connect', data),
  disconnect: () => api.post('/hardware/disconnect'),
};

export default api;
