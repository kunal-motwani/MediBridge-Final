import api from './api';

export const profileService = {
  getProfile: () => api.get('/profile/me'),
  updateProfile: (data) => api.put('/profile/me', data),
  updateAvatar: (data) => api.put('/profile/me/avatar', data),
  getEmergencyProfile: () => api.get('/profile/emergency'),
  updateEmergencyProfile: (data) => api.put('/profile/emergency', data),
  changeAccessPin: (data) => api.put('/profile/access-pin', data),
  getHealthIdData: () => api.get('/profile/health-id'),
  getPublicEmergencyProfile: (healthId) => api.get(`/emergency/${healthId}`),
};
