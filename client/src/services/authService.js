import api from './api';

export const registerPatient = (payload) => api.post('/auth/register', payload);
export const registerDoctor = (payload) => api.post('/auth/register/doctor', payload);
export const login = (payload) => api.post('/auth/login', payload);
export const logout = () => api.post('/auth/logout');
