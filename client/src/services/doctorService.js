import api from './api';

export const doctorService = {
  searchPatient: (healthId) => api.get('/doctors/patients/search', { params: { healthId } }),
  requestAccess: (data) => api.post('/doctors/patients/access', data),
  getPatientRecords: (healthId) => api.get(`/doctors/patients/${healthId}/records`),
  getFile: (healthId, recordId) => api.get(`/doctors/patients/${healthId}/records/${recordId}/file`),
  addRecord: (healthId, formData) => api.post(`/doctors/patients/${healthId}/records`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getPatientPrescriptions: (healthId) => api.get(`/doctors/patients/${healthId}/prescriptions`),
  getPatientAiSummary: (healthId) => api.get(`/doctors/patients/${healthId}/ai-summary`),
  suggestDiagnosis: (healthId, data) => api.post(`/doctors/patients/${healthId}/suggest-diagnosis`, data),
  writePrescription: (healthId, data) => api.post(`/doctors/patients/${healthId}/prescriptions`, data),
  getMyPatients: () => api.get('/doctors/patients'),
  getMySessions: () => api.get('/doctors/sessions'),
  // Ambient Clinical Scribe & Transcribing Integration
  initScribeSession: (healthId) => api.post(`/doctors/patients/${healthId}/scribe/session`),
  importSignedNote: (healthId, data) => api.post(`/doctors/patients/${healthId}/scribe/import-note`, data),
};
