import api from './api';

export const accessService = {
  getAccessLog: () => api.get('/access/log'),
  getActiveSessions: () => api.get('/access/active-sessions'),
  revokeSession: (id, reason) => api.put(`/access/sessions/${id}/revoke`, { reason }),
  grantAccess: (data) => api.post('/access/grant', data),
  getDoctors: () => api.get('/access/doctors'),
};
