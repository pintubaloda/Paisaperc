import apiClient from './apiClient';

const authService = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  register: (data) => apiClient.post('/auth/register', data),
};

export default authService;
