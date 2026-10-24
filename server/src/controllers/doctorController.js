const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const AccessSession = require('../models/AccessSession');
const AccessLog = require('../models/AccessLog');
const MedicalRecord = require('../models/MedicalRecord');
const Prescription = require('../models/Prescription');
const ConsentGrant = require('../models/ConsentGrant');
const bcrypt = require('bcryptjs');
const cloudinary = require('../config/cloudinary');
const EmergencyProfile = require('../models/EmergencyProfile');
const aiSummarizerService = require('../services/aiSummarizerService');
const hfDiagnosticService = require('../services/hfDiagnosticService');


exports.searchPatient = asyncHandler(async (req, res) => {
  const { healthId } = req.query;
  if (!healthId) throw new ApiError(400, 'Health ID is required');

  const patient = await User.findOne({ healthId, role: 'patient' }).select('firstName lastName healthId gender dateOfBirth bloodGroup');
  if (!patient) throw new ApiError(404, 'Patient not found');

  res.status(200).json({ success: true, data: patient });
});

exports.requestAccess = asyncHandler(async (req, res) => {
  const { healthId, accessPin } = req.body;
  const cleanId = String(healthId || '').trim().toUpperCase();
  const cleanPin = String(accessPin || '').trim();

  const patient = await User.findOne({ healthId: cleanId, role: 'patient' }).select('+accessPin');
  if (!patient) throw new ApiError(404, 'Patient not found');

  // Check if patient generated a temporary scoped consent PIN
  const pendingGrant = await ConsentGrant.findOne({
    patientId: patient._id,
    accessPin: cleanPin,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  });

  // Revoke any previous active session between this doctor and patient
  await AccessSession.updateMany(
    { patientId: patient._id, doctorId: req.user._id, status: 'active' },
    { status: 'revoked', revokedAt: new Date(), revokedReason: 'Superceded by new PIN verification' }
  );

  let session;
  if (pendingGrant) {
    const durationHours = pendingGrant.durationHours || 24;
    const expiresAt = new Date(Date.now() + durationHours * 3600 * 1000);

    session = await AccessSession.create({
      patientId: patient._id,
      doctorId: req.user._id,
      expiresAt,
      scopeType: pendingGrant.scopeType,
      allowedRecordIds: pendingGrant.allowedRecordIds,
      allowedCategories: pendingGrant.allowedCategories,
      dateRange: pendingGrant.dateRange,
      excludeSensitive: pendingGrant.excludeSensitive,
      permissions: pendingGrant.permissions || {},
      status: 'active'
    });

    pendingGrant.status = 'used';
    await pendingGrant.save();

    await AccessLog.create({
      patientId: patient._id,
      doctorId: req.user._id,
      doctorName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
      action: 'access_granted',
      details: `Scoped PIN consent verified (${pendingGrant.scopeType}, ${durationHours}h duration)`,
      ipAddress: req.ip
    });
  } else {
    // Fall back to standard patient access PIN
    if (!patient.accessPin) throw new ApiError(401, 'Invalid Access PIN');
    const isMatch = await bcrypt.compare(cleanPin, patient.accessPin);
    if (!isMatch) throw new ApiError(401, 'Invalid Access PIN');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

    session = await AccessSession.create({
      patientId: patient._id,
      doctorId: req.user._id,
      expiresAt,
      scopeType: 'all',
      excludeSensitive: true,
      status: 'active'
    });

    await AccessLog.create({
      patientId: patient._id,
      doctorId: req.user._id,
      doctorName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
      action: 'access_granted',
      details: 'Patient master PIN verified (24h session, sensitive hidden by default)',
      ipAddress: req.ip
    });
  }

  res.status(201).json({ success: true, data: session });
});

exports.getPatientRecords = asyncHandler(async (req, res) => {
  const session = req.accessSession;
  const patientId = req.patient._id;

  // 1. Check base permission
  if (session && session.permissions && session.permissions.viewRecords === false) {
    return res.status(200).json({ 
      success: true, 
      data: [], 
      meta: { message: 'Patient restricted medical record viewing for this session.' } 
    });
  }

  // 2. Build Zero-Trust MongoDB Filter Query
  const query = { 
    userId: patientId,
    isMaskedByPatient: { $ne: true }
  };

  // Exclude Sensitive if flagged
  if (session && session.excludeSensitive) {
    query.sensitivity = { $nin: ['sensitive', 'strictly_confidential'] };
  }

  // Apply Granular Scopes
  if (session && session.scopeType === 'selective_records' && session.allowedRecordIds?.length > 0) {
    query._id = { $in: session.allowedRecordIds };
  } else if (session && session.scopeType === 'category' && session.allowedCategories?.length > 0) {
    query.category = { $in: session.allowedCategories };
  } else if (session && session.scopeType === 'date_range' && session.dateRange?.startDate) {
    query.recordDate = { 
      $gte: new Date(session.dateRange.startDate),
      $lte: new Date(session.dateRange.endDate || Date.now())
    };
  } else if (!session || session.scopeType === 'all') {
    const Permission = require('../models/DocumentAccessPermission');
    if (req.patient.assignedDoctorId && String(req.patient.assignedDoctorId) === String(req.user._id)) {
      const permissionCount = await Permission.countDocuments({ patientId, doctorId: req.user._id });
      if (permissionCount > 0) {
        const shared = await Permission.find({ patientId, doctorId: req.user._id, status: 'active' }).select('recordId');
        query._id = { $in: shared.map((p) => p.recordId) };
      }
    }
  }

  const records = await MedicalRecord.find(query).sort({ recordDate: -1 });

  // Count total existing records to inform doctor of filtered view
  const totalCount = await MedicalRecord.countDocuments({ userId: patientId });

  // 3. Log access audit
  await AccessLog.create({
    patientId,
    doctorId: req.user._id,
    doctorName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
    action: 'viewed_records',
    details: `Viewed ${records.length} of ${totalCount} records under scope '${session ? session.scopeType : 'all'}'`,
    ipAddress: req.ip
  });

  res.status(200).json({ 
    success: true, 
    data: records,
    meta: {
      scopeType: session ? session.scopeType : 'all',
      recordsVisible: records.length,
      totalPatientRecords: totalCount,
      isFiltered: records.length < totalCount,
      excludeSensitive: session ? session.excludeSensitive : false,
      allowedCategories: session ? session.allowedCategories : []
    }
  });
});

exports.addRecordToPatient = asyncHandler(async (req, res) => {
  let fileUrl = null, fileType = null, fileSize = null, filePublicId = null;

  if (req.file) {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream({ folder: 'medibridge/records', type: 'authenticated', resource_type: 'raw' }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
      uploadStream.end(req.file.buffer);
    });
    fileUrl = null;
    fileType = req.file.mimetype;
    fileSize = req.file.size;
    filePublicId = result.public_id;
  }

  const record = await MedicalRecord.create({
    ...req.body,
    userId: req.patient._id,
    uploadedBy: {
      type: 'doctor',
      doctorId: req.user._id,
      doctorName: `${req.user.firstName} ${req.user.lastName}`
    },
    fileUrl, filePublicId, fileType, fileSize
  });

  res.status(201).json({ success: true, data: record });
});

exports.getPatientPrescriptions = asyncHandler(async (req, res) => {
  const prescriptions = await Prescription.find({ patientId: req.patient._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: prescriptions });
});

exports.writePrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.create({
    ...req.body,
    patientId: req.patient._id,
    doctorId: req.user._id
  });

  res.status(201).json({ success: true, data: prescription });
});

exports.getMyPatients = asyncHandler(async (req, res) => {
  const logs = await AccessLog.find({ doctorId: req.user._id }).distinct('patientId');
  const patients = await User.find({ _id: { $in: logs } }).select('firstName lastName healthId gender avatar');
  res.status(200).json({ success: true, data: patients });
});

exports.getMySessions = asyncHandler(async (req, res) => {
  const sessions = await AccessSession.find({ doctorId: req.user._id, status: 'active' }).populate('patientId', 'firstName lastName healthId avatar');
  res.status(200).json({ success: true, data: sessions });
});

exports.getDoctorDashboard = asyncHandler(async (req, res) => {
  const activeSessions = await AccessSession.countDocuments({ doctorId: req.user._id, status: 'active' });
  const prescriptionsWritten = await Prescription.countDocuments({ doctorId: req.user._id });
  const uniquePatients = (await AccessLog.find({ doctorId: req.user._id }).distinct('patientId')).length;

  res.status(200).json({ success: true, data: { activeSessions, prescriptionsWritten, uniquePatients } });
});

exports.getPatientAiSummary = asyncHandler(async (req, res) => {
  const patient = req.patient;
  const session = req.accessSession;

  // Build Zero-Trust privacy filtered query
  const query = { userId: patient._id };
  if (session && session.scopeType === 'selective') {
    if (session.allowedCategories && session.allowedCategories.length > 0) {
      query.category = { $in: session.allowedCategories };
    }
  }
  if (session && session.excludeSensitive) {
    query.sensitivity = { $nin: ['sensitive', 'strictly_confidential'] };
    query.isMaskedByPatient = { $ne: true };
  }

  const [records, prescriptions, emergencyProfile] = await Promise.all([
    MedicalRecord.find(query).sort({ recordDate: -1, createdAt: -1 }),
    Prescription.find({ patientId: patient._id }).sort({ createdAt: -1 }),
    EmergencyProfile.findOne({ userId: patient._id })
  ]);

  const summary = await aiSummarizerService.generateMedicalSummary({
    patient: {
      name: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.name || 'Rahul Sharma',
      healthId: patient.healthId,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup
    },
    records,
    prescriptions,
    emergencyProfile
  });

  res.status(200).json({ success: true, data: summary });
});

exports.suggestPatientDiagnosis = asyncHandler(async (req, res) => {
  const patient = req.patient;
  const session = req.accessSession;
  const { symptoms, customNotes, overrideVitals } = req.body;

  // Build Zero-Trust privacy filtered query
  const query = { userId: patient._id };
  if (session && session.scopeType === 'selective') {
    if (session.allowedCategories && session.allowedCategories.length > 0) {
      query.category = { $in: session.allowedCategories };
    }
  }
  if (session && session.excludeSensitive) {
    query.sensitivity = { $nin: ['sensitive', 'strictly_confidential'] };
    query.isMaskedByPatient = { $ne: true };
  }

  const [records, prescriptions, emergencyProfile] = await Promise.all([
    MedicalRecord.find(query).sort({ recordDate: -1, createdAt: -1 }),
    Prescription.find({ patientId: patient._id }).sort({ createdAt: -1 }),
    EmergencyProfile.findOne({ userId: patient._id })
  ]);

  const diagnosisResult = await hfDiagnosticService.suggestDifferentialDiagnosis({
    patient: {
      name: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.name || 'Rahul Sharma',
      healthId: patient.healthId,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup
    },
    symptoms: symptoms || 'Routine follow-up for diabetes and blood pressure check.',
    customNotes,
    records,
    prescriptions,
    emergencyProfile
  });

  res.status(200).json({ success: true, data: diagnosisResult });
});
