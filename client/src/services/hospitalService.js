import api from './api';

export const hospitalService = {
  getHospitals: (params = {}) => api.get('/hospitals', { params }),
  getHospitalById: (id) => api.get(`/hospitals/${id}`),
  searchHospitals: (query) => {
    const params = typeof query === 'string' ? { q: query } : (query || {});
    return api.get('/hospitals/search', { params });
  },
};

