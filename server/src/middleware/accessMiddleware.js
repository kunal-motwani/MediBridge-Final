const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const AccessSession = require('../models/AccessSession');
const AccessLog = require('../models/AccessLog');
const User = require('../models/User');

exports.verifyDoctorAccess = asyncHandler(async (req, res, next) => {
  const doctorId = req.user._id;
  const healthId = String(req.params.healthId || '').trim().toUpperCase();

  const patient = await User.findOne({ healthId, role: 'patient' });
  if (!patient) {
    throw new ApiError(404, 'Patient not found');
  }

  let session = await AccessSession.findOne({
    patientId: patient._id,
    doctorId: doctorId,
    status: 'active',
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  // DEMO & ASSIGNED DOCTOR AUTO-PASS:
  // If no session exists, auto-grant 30-day access for demo doctor or assigned doctor
  if (!session && (String(patient.assignedDoctorId) === String(doctorId) || req.user.email === 'doctor@demo.com')) {
    session = await AccessSession.create({
      patientId: patient._id,
      doctorId: doctorId,
      status: 'active',
      scopeType: 'all',
      excludeSensitive: false,
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      permissions: {
        viewRecords: true,
        viewPrescriptions: true,
        viewEmergency: true,
        addRecords: true,
        addPrescription: true
      }
    });
    console.log(`[Auto-Consent] Active 30-day AccessSession created for ${req.user.email} -> ${patient.healthId}`);
  }

  if (!session) {
    throw new ApiError(403, 'Access denied or session expired. Patient PIN or consent required.');
  }

  // Permission checks
  if (req.method === 'POST') {
    if (req.originalUrl.includes('prescription') && session.permissions && session.permissions.addPrescription === false) {
      throw new ApiError(403, 'Patient restricted adding prescriptions for this session.');
    }
    if (!req.originalUrl.includes('prescription') && session.permissions && session.permissions.addRecords === false) {
      throw new ApiError(403, 'Patient restricted adding records for this session.');
    }
  } else if (req.method === 'GET') {
    if (req.originalUrl.includes('prescription') && session.permissions && session.permissions.viewPrescriptions === false) {
      throw new ApiError(403, 'Patient restricted viewing prescriptions for this session.');
    }
  }

  // Log prescriptions and added records here (records viewing is logged in getPatientRecords with scope details)
  if (req.method === 'POST') {
    const action = req.originalUrl.includes('prescription') ? 'added_prescription' : 'added_record';
    await AccessLog.create({
      patientId: patient._id,
      doctorId: doctorId,
      doctorName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
      action: action,
      ipAddress: req.ip
    });
  } else if (req.method === 'GET' && req.originalUrl.includes('prescription')) {
    await AccessLog.create({
      patientId: patient._id,
      doctorId: doctorId,
      doctorName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
      action: 'viewed_prescriptions',
      ipAddress: req.ip
    });
  }

  req.patient = patient;
  req.accessSession = session;
  next();
});
