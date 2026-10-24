const express = require('express');
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const {
  registerPatientSchema,
  registerDoctorSchema,
  loginSchema,
  refreshSchema,
} = require('../validators/authValidator');
const {
  registerPatient,
  registerDoctor,
  login,
  refresh,
  logout,
} = require('../controllers/authController');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

router.post('/register', authLimiter, validate(registerPatientSchema), registerPatient);
router.post('/register/doctor', authLimiter, validate(registerDoctorSchema), registerDoctor);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', protect, logout);

module.exports = router;
