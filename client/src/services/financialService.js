import api from './api';

export const financialService = {
  checkEligibility: (data) => api.post('/financial/eligibility', data),
  createLoanApplication: (data) => api.post('/financial/loans', data),
  getMyApplications: () => api.get('/financial/loans'),
  getApplicationById: (id) => api.get(`/financial/loans/${id}`),
};
