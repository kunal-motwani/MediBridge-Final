const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const AccessLog = require('../models/AccessLog');
const AccessSession = require('../models/AccessSession');
const ConsentGrant = require('../models/ConsentGrant');
const User = require('../models/User');

exports.grantAccess = asyncHandler(async (req, res) => {
  const {
    doctorId,
    scopeType = 'all',
    allowedRecordIds = [],
    allowedCategories = [],
    dateRange,
    excludeSensitive = true,
    durationHours = 24,
    permissions = {},
    generatePin = false
  } = req.body;

  // Option A: Generate 1-Time Custom PIN for walk-in / in-person verification
  if (generatePin || !doctorId) {
    // Generate secure 4-digit PIN
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15-minute validity to redeem

    // Expire any existing pending grants for this patient
    await ConsentGrant.updateMany(
      { patientId: req.user._id, status: 'pending' },
      { status: 'expired' }
    );

    const grant = await ConsentGrant.create({
      patientId: req.user._id,
      accessPin: pin,
      scopeType,
      allowedRecordIds,
      allowedCategories,
      dateRange,
      excludeSensitive,
      durationHours: Number(durationHours) || 24,
      permissions: {
        viewRecords: permissions.viewRecords !== false,
        viewPrescriptions: permissions.viewPrescriptions !== false,
        viewEmergency: permissions.viewEmergency !== false,
        addRecords: permissions.addRecords !== false,
        addPrescription: permissions.addPrescription !== false,
      },
      status: 'pending',
      expiresAt
    });

    return res.status(201).json({
      success: true,
      message: '1-Time Custom Consent PIN generated successfully. Valid for 15 minutes.',
      data: {
        pin: grant.accessPin,
        expiresAt: grant.expiresAt,
        scopeType: grant.scopeType,
        durationHours: grant.durationHours,
        excludeSensitive: grant.excludeSensitive,
        allowedCategories: grant.allowedCategories,
        allowedRecordCount: grant.allowedRecordIds.length
      }
    });
  }

  // Option B: Direct doctor session grant
  const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  const duration = Number(durationHours) || 24;
  const expiresAt = new Date(Date.now() + duration * 3600 * 1000);

  // Revoke any existing active session between this patient and doctor
  await AccessSession.updateMany(
    { patientId: req.user._id, doctorId, status: 'active' },
    { status: 'revoked', revokedAt: new Date(), revokedReason: 'Replaced with new custom consent session' }
  );

  const session = await AccessSession.create({
    patientId: req.user._id,
    doctorId,
    status: 'active',
    expiresAt,
    scopeType,
    allowedRecordIds,
    allowedCategories,
    dateRange,
    excludeSensitive,
    permissions: {
      viewRecords: permissions.viewRecords !== false,
      viewPrescriptions: permissions.viewPrescriptions !== false,
      viewEmergency: permissions.viewEmergency !== false,
      addRecords: permissions.addRecords !== false,
      addPrescription: permissions.addPrescription !== false,
    }
  });

  await AccessLog.create({
    patientId: req.user._id,
    doctorId: doctor._id,
    doctorName: `${doctor.firstName} ${doctor.lastName}`,
    action: 'access_granted',
    details: `Patient granted custom consent (${scopeType}, ${duration}h TTL, sensitive: ${excludeSensitive ? 'hidden' : 'allowed'})`,
    ipAddress: req.ip
  });

  const populated = await AccessSession.findById(session._id)
    .populate('doctorId', 'firstName lastName email doctorProfile avatar')
    .populate('allowedRecordIds', 'title category department recordDate');

  res.status(201).json({
    success: true,
    message: 'Doctor consent granted successfully.',
    data: populated
  });
});

exports.getAccessLog = asyncHandler(async (req, res) => {
  const logs = await AccessLog.find({ patientId: req.user._id })
    .populate('doctorId', 'firstName lastName email role doctorProfile avatar')
    .populate('recordId', 'title category department')
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: logs });
});

exports.getActiveSessions = asyncHandler(async (req, res) => {
  const sessions = await AccessSession.find({
    patientId: req.user._id,
    status: 'active',
    expiresAt: { $gt: new Date() }
  })
    .populate('doctorId', 'firstName lastName email role doctorProfile avatar')
    .populate('allowedRecordIds', 'title category department recordDate')
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: sessions });
});

exports.revokeSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body || {};

  const session = await AccessSession.findOne({
    _id: id,
    patientId: req.user._id,
    status: 'active'
  }).populate('doctorId', 'firstName lastName email');

  if (!session) {
    throw new ApiError(404, 'Active session not found');
  }

  session.status = 'revoked';
  session.revokedAt = new Date();
  session.revokedReason = reason || 'Patient revoked consent manually';
  await session.save();

  await AccessLog.create({
    patientId: req.user._id,
    doctorId: session.doctorId?._id || session.doctorId,
    doctorName: session.doctorId?.firstName ? `${session.doctorId.firstName} ${session.doctorId.lastName}` : 'Doctor',
    action: 'access_revoked',
    details: session.revokedReason,
    ipAddress: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Doctor access revoked immediately.',
    data: session
  });
});

exports.getDoctors = asyncHandler(async (req, res) => {
  const doctors = await User.find({ role: 'doctor' }).select('firstName lastName email doctorProfile avatar');
  res.status(200).json({ success: true, data: doctors });
});
