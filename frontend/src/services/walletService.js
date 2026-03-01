import apiClient from './apiClient';

const walletService = {
  getMyWallet: () => apiClient.get('/wallet/my'),
  getAllWallets: () => apiClient.get('/wallet/all'),
  getLedgerReport: (params) => apiClient.post('/wallet/ledger-report', params),
};

export default walletService;
