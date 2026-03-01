import apiClient from './apiClient';
import authService from './authService';
import rechargeService from './rechargeService';
import adminService from './adminService';

const api = {
  auth: authService,
  admin: adminService,
  client: apiClient,

  // === Namespaced sub-objects used across all pages ===

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

  recharge: {
    ...rechargeService,
    getMy: (limit) => apiClient.get(`/recharge/my?limit=${limit || 100}`),
    create: (data) => apiClient.post('/recharge', data),
    getFailed: (limit) => apiClient.get(`/recharge/failed/list?limit=${limit || 100}`),
    getPending: (limit) => apiClient.get(`/recharge/pending/list?limit=${limit || 100}`),
  },

  commission: {
    getAll: () => apiClient.get('/commission'),
    create: (data) => apiClient.post('/commission', data),
    update: (id, data) => apiClient.put(`/commission/${id}`, data),
    delete: (id) => apiClient.delete(`/commission/${id}`),
  },

  routing: {
    getAll: () => apiClient.get('/routing'),
    create: (data) => apiClient.post('/routing', data),
    update: (id, data) => apiClient.put(`/routing/${id}`, data),
    delete: (id) => apiClient.delete(`/routing/${id}`),
  },

  apiConfig: {
    getAll: () => apiClient.get('/api-config'),
    create: (data) => apiClient.post('/api-config', data),
    update: (id, data) => apiClient.put(`/api-config/${id}`, data),
    delete: (id) => apiClient.delete(`/api-config/${id}`),
    testApi: (id, data) => apiClient.post(`/api-config/${id}/test`, data),
    getCallbackUrl: (id) => apiClient.get(`/api-config/${id}/callback-url`),
    updateOperatorCodes: (id, codes) => apiClient.put(`/api-config/${id}/operator-codes`, { operatorCodes: codes }),
    updateResponseMappings: (id, data) => apiClient.put(`/api-config/${id}/response-mappings`, data),
  },

  operatorApiMapping: {
    getAll: () => apiClient.get('/operator-api-mapping'),
    create: (data) => apiClient.post('/operator-api-mapping', data),
    delete: (id) => apiClient.delete(`/operator-api-mapping/${id}`),
  },

  reports: {
    getAdminDashboard: () => apiClient.get('/reports/admin-dashboard'),
    getDashboardStats: () => apiClient.get('/reports/dashboard-stats'),
    getTransactions: (params) => apiClient.get('/reports/transactions', { params }),
    getLedger: (limit) => apiClient.get(`/reports/ledger?limit=${limit || 100}`),
  },

  kyc: {
    submit: (data) => apiClient.post('/kyc/submit', data),
    getMy: () => apiClient.get('/kyc/my'),
    getAll: () => apiClient.get('/kyc/all'),
    getPending: () => apiClient.get('/kyc/pending'),
    getUser: (userId) => apiClient.get(`/kyc/user/${userId}`),
    verify: (id, data) => apiClient.post(`/kyc/${id}/verify`, data),
  },

  disputes: {
    getAll: () => apiClient.get('/disputes'),
    getUnresolved: () => apiClient.get('/disputes/unresolved'),
    resolve: (id, data) => apiClient.post(`/disputes/${id}/resolve`, data),
  },

  reconciliation: {
    getReport: () => apiClient.get('/reconciliation/report'),
    run: () => apiClient.post('/reconciliation/run'),
  },

  twoFactor: {
    enable: () => apiClient.post('/two-factor/enable'),
    disable: () => apiClient.delete('/two-factor/disable'),
    verify: (code) => apiClient.post('/two-factor/verify', { code }),
    getStatus: () => apiClient.get('/two-factor/status'),
  },

  // Direct methods (backward compat)
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
