import apiClient from './apiClient';

const rechargeService = {
  doRecharge: (data) => apiClient.post('/recharge', data),
  getMyTransactions: () => apiClient.get('/recharge/my'),
  getAllTransactions: (limit = 1000) => apiClient.get(`/recharge/all?limit=${limit}`),
  getAll: (limit = 1000) => apiClient.get(`/recharge/all?limit=${limit}`),
  getStats: () => apiClient.get('/recharge/stats'),
  getFailedTransactions: () => apiClient.get('/recharge/failed/list'),
  getPendingTransactions: () => apiClient.get('/recharge/pending/list'),
  getTransactionDetail: (id) => apiClient.get(`/recharge/detail/${id}`),
  checkStatus: (id) => apiClient.post(`/recharge/${id}/check-status`),
  retry: (id) => apiClient.post(`/recharge/${id}/retry`),
  retryWithApi: (id, apiId) => apiClient.post(`/recharge/${id}/retry-with-api`, { apiId }),
  changeStatus: (id, status, note) => apiClient.post(`/recharge/${id}/change-status`, { status, note }),
  bulkResolve: () => apiClient.post('/recharge/bulk-resolve'),
  getTimeline: (id) => apiClient.get(`/recharge/timeline/${id}`),
  sandboxTest: (data) => apiClient.post('/recharge/sandbox-test', data),
};

export default rechargeService;
