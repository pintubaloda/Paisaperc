import apiClient from './apiClient';

const adminService = {
  // Users
  getUsers: () => apiClient.get('/users'),
  updateUser: (id, data) => apiClient.put(`/users/${id}`, data),
  adjustWallet: (id, data) => apiClient.post(`/users/${id}/adjust-wallet`, data),

  // Operators
  getOperators: () => apiClient.get('/operators'),
  createOperator: (data) => apiClient.post('/operators', data),
  updateOperator: (id, data) => apiClient.put(`/operators/${id}`, data),
  deleteOperator: (id) => apiClient.delete(`/operators/${id}`),

  // API Config
  getAPIs: () => apiClient.get('/api-config'),
  createAPI: (data) => apiClient.post('/api-config', data),
  updateAPI: (id, data) => apiClient.put(`/api-config/${id}`, data),
  deleteAPI: (id) => apiClient.delete(`/api-config/${id}`),
  testAPI: (data) => apiClient.post('/api-config/test-api', data),

  // Commission
  getCommissions: () => apiClient.get('/commission'),
  createCommission: (data) => apiClient.post('/commission', data),
  updateCommission: (id, data) => apiClient.put(`/commission/${id}`, data),
  deleteCommission: (id) => apiClient.delete(`/commission/${id}`),

  // Routing
  getRouting: () => apiClient.get('/routing'),
  createRouting: (data) => apiClient.post('/routing', data),
  updateRouting: (id, data) => apiClient.put(`/routing/${id}`, data),
  deleteRouting: (id) => apiClient.delete(`/routing/${id}`),

  // KYC
  getKYCDocuments: () => apiClient.get('/kyc/all'),
  getPendingKYC: () => apiClient.get('/kyc/pending'),
  getUserKYC: (userId) => apiClient.get(`/kyc/user/${userId}`),
  verifyKYC: (id, data) => apiClient.post(`/kyc/${id}/verify`, data),
  submitKYC: (data) => apiClient.post('/kyc/submit', data),
  getMyKYC: () => apiClient.get('/kyc/my'),

  // Disputes
  getDisputes: () => apiClient.get('/disputes'),
  getUnresolvedDisputes: () => apiClient.get('/disputes/unresolved'),
  resolveDispute: (id, data) => apiClient.post(`/disputes/${id}/resolve`, data),

  // Reconciliation
  getReconciliationReport: () => apiClient.get('/reconciliation/report'),
  runReconciliation: () => apiClient.post('/reconciliation/run'),

  // 2FA
  enable2FA: () => apiClient.post('/two-factor/enable'),
  disable2FA: () => apiClient.delete('/two-factor/disable'),
  verify2FA: (code) => apiClient.post('/two-factor/verify', { code }),
  get2FAStatus: () => apiClient.get('/two-factor/status'),

  // Reports
  getLedgerReport: (params) => apiClient.post('/wallet/ledger-report', params),
  getReports: (limit) => apiClient.get(`/reports/ledger?limit=${limit || 100}`),
};

export default adminService;
