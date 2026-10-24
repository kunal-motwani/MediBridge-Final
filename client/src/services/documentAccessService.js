import api from './api';

export const documentAccessService = {
  getMine: (doctorId) => api.get('/document-access/me', { params: doctorId ? { doctorId } : {} }),
  assignDoctor: (doctorId) => api.post('/document-access/assign-doctor', { doctorId }),
  grant: (recordId, doctorId) => api.put(`/document-access/${recordId}/grant`, { doctorId }),
  revoke: (recordId, doctorId) => api.put(`/document-access/${recordId}/revoke`, { doctorId }),
};
