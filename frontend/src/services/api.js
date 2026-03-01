import apiClient from './apiClient';
import authService from './authService';
import rechargeService from './rechargeService';
import adminService from './adminService';

const api = {
  auth: authService,
  admin: adminService,
  recharge: rechargeService,
  client: apiClient,

  // Namespaced sub-objects used across all pages
  users: {
    getAll: () => apiClient.get('/users'),
    getMe: () => apiClient.get('/users/me'),
    update: (id, data) => apiClient.patch(`/users/${id}`, data),
    toggleStatus: (id) => apiClient.patch(`/users/${id}/toggle-status`),
    adjustWallet: (id, data) => apiClient.post(`/users/${id}/adjust-wallet`, data),
  },

  operators: {
    getAll: () => apiClient.get('/operators'),
    create: (data) => apiClient.post('/operators', data),
    update: (id, data) => apiClient.put(`/operators/${id}`, data),
    delete: (id) => apiClient.delete(`/operators/${id}`),
  },

  wallet: {
    get: () => apiClient.get('/wallet'),
    getAll: () => apiClient.get('/wallet/all'),
    getLedger: (limit) => apiClient.get(`/wallet/ledger?limit=${limit || 50}`),
    getUserLedger: (userId, limit) => apiClient.get(`/wallet/user/${userId}/ledger?limit=${limit || 50}`),
    getLedgerReport: (params) => apiClient.get(`/wallet/ledger-report?userId=${params?.userId || ''}&startDate=${params?.startDate || ''}&endDate=${params?.endDate || ''}&limit=${params?.limit || 5000}`),
  },

  // Direct methods (backward compat for any remaining usage)
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  register: (data) => apiClient.post('/auth/register', data),
  getUsers: () => apiClient.get('/users'),
  getOperators: () => apiClient.get('/operators'),
  createOperator: (data) => apiClient.post('/operators', data),
  updateOperator: (id, data) => apiClient.put(`/operators/${id}`, data),
  deleteOperator: (id) => apiClient.delete(`/operators/${id}`),
  getAPIs: () => apiClient.get('/api-config'),
  createAPI: (data) => apiClient.post('/api-config', data),
  updateAPI: (id, data) => apiClient.put(`/api-config/${id}`, data),
  deleteAPI: (id) => apiClient.delete(`/api-config/${id}`),
  testAPI: (data) => apiClient.post('/api-config/test-api', data),
  getCommissions: () => apiClient.get('/commission'),
  createCommission: (data) => apiClient.post('/commission', data),
  updateCommission: (id, data) => apiClient.put(`/commission/${id}`, data),
  deleteCommission: (id) => apiClient.delete(`/commission/${id}`),
  getRouting: () => apiClient.get('/routing'),
  createRouting: (data) => apiClient.post('/routing', data),
  updateRouting: (id, data) => apiClient.put(`/routing/${id}`, data),
  deleteRouting: (id) => apiClient.delete(`/routing/${id}`),
  getStats: () => apiClient.get('/recharge/stats'),
  getAllTransactions: (limit) => apiClient.get(`/recharge/all?limit=${limit || 1000}`),
  getMyTransactions: () => apiClient.get('/recharge/my'),
  doRecharge: (data) => apiClient.post('/recharge', data),
  checkStatus: (id) => apiClient.post(`/recharge/${id}/check-status`),
  getWallet: () => apiClient.get('/wallet/my'),
  getAllWallets: () => apiClient.get('/wallet/all'),
  getLedgerReport: (params) => apiClient.post('/wallet/ledger-report', params),
  updateUser: (id, data) => apiClient.put(`/users/${id}`, data),
  adjustWallet: (id, data) => apiClient.post(`/users/${id}/adjust-wallet`, data),
  sandboxTest: (data) => apiClient.post('/recharge/sandbox-test', data),
  runSandboxTest: (data) => apiClient.post('/recharge/run-sandbox-test', data),
};

export default api;
