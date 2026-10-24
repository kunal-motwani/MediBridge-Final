import api from './api';

export const appointmentService = {
  createAppointment: (data) => api.post('/appointments', data),
  getAppointments: () => api.get('/appointments'),
  getDoctorAppointments: () => api.get('/appointments/doctor'),
  updateStatus: (id, status) => api.patch(`/appointments/${id}/status`, { status })
};
