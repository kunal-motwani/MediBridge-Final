import api from './api';

export const prescriptionService = {
  getPrescriptions: (params) => api.get('/prescriptions', { params }),
  getActivePrescriptions: () => api.get('/prescriptions/active'),
  getPrescriptionById: (id) => api.get(`/prescriptions/${id}`),
  markComplete: (id) => api.put(`/prescriptions/${id}/complete`),
};
