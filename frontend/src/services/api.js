import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default {
  auth: {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
  },
  users: {
    getMe: () => api.get('/users/me'),
    getAll: () => api.get('/users'),
    updateKyc: (data) => api.post('/users/kyc', data),
    toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
    update: (id, data) => api.patch(`/users/${id}`, data),
    adjustWallet: (id, data) => api.post(`/users/${id}/adjust-wallet`, data),
  },
  wallet: {
    get: () => api.get('/wallet'),
    getLedger: (limit = 100) => api.get(`/wallet/ledger?limit=${limit}`),
    getAllLedgers: (limit = 1000) => api.get(`/wallet/all-ledgers?limit=${limit}`),
  },
  operators: {
    getAll: () => api.get('/operators'),
    create: (data) => api.post('/operators', data),
    update: (id, data) => api.put(`/operators/${id}`, data),
    delete: (id) => api.delete(`/operators/${id}`),
  },
  apiConfig: {
    getAll: () => api.get('/api-config'),
    getById: (id) => api.get(`/api-config/${id}`),
    getCallbackUrl: (id) => api.get(`/api-config/${id}/callback-url`),
    create: (data) => api.post('/api-config', data),
    update: (id, data) => api.put(`/api-config/${id}`, data),
    updateOperatorCodes: (id, operatorCodes) => api.put(`/api-config/${id}/operator-codes`, { operatorCodes }),
    updateResponseMappings: (id, data) => api.put(`/api-config/${id}/response-mappings`, data),
    delete: (id) => api.delete(`/api-config/${id}`),
  },
  commission: {
    getAll: () => api.get('/commission'),
    create: (data) => api.post('/commission', data),
    update: (id, data) => api.put(`/commission/${id}`, data),
    delete: (id) => api.delete(`/commission/${id}`),
  },
  routing: {
    getAll: () => api.get('/routing'),
    create: (data) => api.post('/routing', data),
    update: (id, data) => api.put(`/routing/${id}`, data),
    delete: (id) => api.delete(`/routing/${id}`),
  },
  recharge: {
    create: (data) => api.post('/recharge', data),
    getMy: (limit = 100) => api.get(`/recharge?limit=${limit}`),
    getAll: (limit = 1000) => api.get(`/recharge/all?limit=${limit}`),
    getById: (id) => api.get(`/recharge/${id}`),
    getStats: () => api.get('/recharge/stats'),
    retry: (id) => api.post(`/recharge/${id}/retry`),
    getFailed: (limit = 100) => api.get(`/recharge/failed/list?limit=${limit}`),
    getPending: (limit = 100) => api.get(`/recharge/pending/list?limit=${limit}`),
  },
  paymentRequests: {
    create: (data, file) => {
      const formData = new FormData();
      Object.keys(data).forEach(key => formData.append(key, data[key]));
      if (file) formData.append('proof', file);
      return api.post('/payment-requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    getMy: () => api.get('/payment-requests'),
    getAll: () => api.get('/payment-requests/all'),
    update: (id, data) => api.patch(`/payment-requests/${id}`, data),
  },
  reports: {
    getDashboardStats: () => api.get('/reports/dashboard-stats'),
    getAdminDashboard: () => api.get('/reports/admin-dashboard'),
    getTransactions: (limit) => api.get(`/reports/transactions?limit=${limit || 100}`),
    getLedger: (limit) => api.get(`/reports/ledger?limit=${limit || 100}`),
  },
};
