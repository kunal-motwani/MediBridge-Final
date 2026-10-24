import api from './api';

export const recordService = {
  getRecords: (params) => api.get('/records', { params }),
  getRecordById: (id) => api.get(`/records/${id}`),
  getFileUrl: (id) => api.get(`/records/${id}/file`),
  createRecord: (formData) => api.post('/records', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateRecord: (id, data) => api.put(`/records/${id}`, data),
  updateRecordPrivacy: (id, data) => api.put(`/records/${id}/privacy`, data),
  deleteRecord: (id) => api.delete(`/records/${id}`),
  fetchFromHospital: (data) => api.post('/records/fetch-from-hospital', data),
  getMyAiSummary: () => api.get('/records/ai-summary'),
};
