// Barrel export - backward compatible
// New code should import from specific service modules
import apiClient from './apiClient';
import authService from './authService';
import rechargeService from './rechargeService';
import walletService from './walletService';
import adminService from './adminService';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = {
  auth: authService,
  admin: adminService,
  recharge: rechargeService,
  wallet: walletService,
  client: apiClient,

  // Legacy compat - direct methods
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
  getFailedTransactions: () => apiClient.get('/recharge/failed/list'),
  getPendingTransactions: () => apiClient.get('/recharge/pending/list'),
  getMyTransactions: () => apiClient.get('/recharge/my'),
  doRecharge: (data) => apiClient.post('/recharge', data),
  retryRecharge: (id) => apiClient.post(`/recharge/${id}/retry`),
  checkStatus: (id) => apiClient.post(`/recharge/${id}/check-status`),
  getWallet: () => apiClient.get('/wallet/my'),
  getAllWallets: () => apiClient.get('/wallet/all'),
  getLedgerReport: (params) => apiClient.post('/wallet/ledger-report', params),
  updateUser: (id, data) => apiClient.put(`/users/${id}`, data),
  adjustWallet: (id, data) => apiClient.post(`/users/${id}/adjust-wallet`, data),
  sandboxTest: (data) => apiClient.post('/recharge/sandbox-test', data),
  runSandboxTest: (data) => apiClient.post('/recharge/run-sandbox-test', data),
  getReports: (limit) => apiClient.get(`/reports/ledger?limit=${limit || 100}`),
};

export default api;
