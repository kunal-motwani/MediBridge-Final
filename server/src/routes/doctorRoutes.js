const express = require('express');
const { searchPatient, requestAccess, getPatientRecords, getPatientAiSummary, suggestPatientDiagnosis, addRecordToPatient, getPatientPrescriptions, writePrescription, getMyPatients, getMySessions, getDoctorDashboard } = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { verifyDoctorAccess } = require('../middleware/accessMiddleware');
const upload = require('../middleware/upload');
const documentAccess = require('../controllers/documentAccessController');
const { initScribeSession, importSignedNote } = require('../controllers/scribeIntegrationController');
const AccessSession = require('../models/AccessSession');

const router = express.Router();

router.use(protect);
router.use(authorize('doctor'));

router.get('/patients/search', searchPatient);
router.post('/patients/access', requestAccess);
router.get('/patients', getMyPatients);
router.get('/sessions', getMySessions);
router.get('/dashboard', getDoctorDashboard);

// Check if doctor has an active verified session for a patient
router.get('/patients/:healthId/session-status', async (req, res) => {
  const User = require('../models/User');
  const patient = await User.findOne({ healthId: req.params.healthId.toUpperCase(), role: 'patient' });
  if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

  const session = await AccessSession.findOne({
    patientId: patient._id,
    doctorId: req.user._id,
    status: 'active',
    expiresAt: { $gt: new Date() }
  });

  res.json({
    success: true,
    data: {
      hasAccess: !!session,
      expiresAt: session?.expiresAt || null,
      scopeType: session?.scopeType || null
    }
  });
});

router.get('/patients/:healthId/records', verifyDoctorAccess, getPatientRecords);
router.get('/patients/:healthId/ai-summary', verifyDoctorAccess, getPatientAiSummary);
router.post('/patients/:healthId/suggest-diagnosis', verifyDoctorAccess, suggestPatientDiagnosis);
router.get('/patients/:healthId/records/:recordId/file', verifyDoctorAccess, documentAccess.getAuthorizedFile);
router.post('/patients/:healthId/records', verifyDoctorAccess, upload.single('file'), addRecordToPatient);
router.get('/patients/:healthId/prescriptions', verifyDoctorAccess, getPatientPrescriptions);
router.post('/patients/:healthId/prescriptions', verifyDoctorAccess, writePrescription);

// Ambient Clinical Scribe & Medical Transcribing Integration
router.post('/patients/:healthId/scribe/session', verifyDoctorAccess, initScribeSession);
router.post('/patients/:healthId/scribe/import-note', verifyDoctorAccess, importSignedNote);

module.exports = router;
