const express = require('express');
const { 
  createAppointment, 
  getAppointments, 
  getDoctorAppointments, 
  updateAppointmentStatus 
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // Ensure user is logged in

// Patient routes
router.post('/', createAppointment);
router.get('/', getAppointments);

// Doctor routes
router.get('/doctor', getDoctorAppointments);
router.patch('/:id/status', updateAppointmentStatus);

module.exports = router;
