const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');
const Permission = require('../models/DocumentAccessPermission');
const AccessSession = require('../models/AccessSession');
const AccessLog = require('../models/AccessLog');
const cloudinary = require('../config/cloudinary');

const assignedDoctor = async (patient) => {
  if (!patient.assignedDoctorId) return null;
  return User.findOne({ _id: patient.assignedDoctorId, role: 'doctor' }).select('firstName lastName email doctorProfile.specialization');
};

exports.listMyAccess = asyncHandler(async (req, res) => {
  const activeDoctorId = req.query.doctorId || req.user.assignedDoctorId;
  let doctor = null;
  if (activeDoctorId) {
    doctor = await User.findOne({ _id: activeDoctorId, role: 'doctor' }).select('firstName lastName email doctorProfile.specialization');
  }

  const allDoctors = await User.find({ role: 'doctor' }).select('firstName lastName email doctorProfile avatar');
  const records = await MedicalRecord.find({ userId: req.user._id }).sort({ recordDate: -1 }).lean();
  const permissions = doctor ? await Permission.find({ patientId: req.user._id, doctorId: doctor._id }).lean() : [];
  const byRecord = new Map(permissions.map((p) => [String(p.recordId), p]));

  res.json({ success: true, data: {
    doctor,
    allDoctors,
    records: records.map((record) => ({ ...record, accessStatus: byRecord.get(String(record._id))?.status === 'active' ? 'shared' : 'private' })),
  } });
});

exports.setAssignedDoctor = asyncHandler(async (req, res) => {
  const { doctorId } = req.body;
  if (!doctorId) throw new ApiError(400, 'doctorId is required');

  const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  req.user.assignedDoctorId = doctor._id;
  await req.user.save();

  res.json({
    success: true,
    message: `Dr. ${doctor.firstName} ${doctor.lastName} assigned successfully.`,
    data: {
      _id: doctor._id,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      email: doctor.email,
      doctorProfile: doctor.doctorProfile
    }
  });
});

exports.grant = asyncHandler(async (req, res) => changePermission(req, res, true));
exports.revoke = asyncHandler(async (req, res) => changePermission(req, res, false));

async function changePermission(req, res, grant) {
  const patient = req.user;
  const record = await MedicalRecord.findOne({ _id: req.params.recordId, userId: patient._id }).select('_id');
  if (!record) throw new ApiError(404, 'Record not found');

  const targetDoctorId = req.body.doctorId || req.query.doctorId || patient.assignedDoctorId;
  if (!targetDoctorId) throw new ApiError(409, 'Please select a doctor to grant or revoke access');

  const doctor = await User.findOne({ _id: targetDoctorId, role: 'doctor' }).select('firstName lastName email doctorProfile.specialization');
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  // If patient doesn't have an assigned doctor yet, set this doctor
  if (!patient.assignedDoctorId) {
    patient.assignedDoctorId = doctor._id;
    await patient.save();
  }

  const now = new Date();
  let permission;
  try { permission = await Permission.findOneAndUpdate(
    { patientId: patient._id, recordId: record._id, doctorId: doctor._id },
    grant
      ? { $set: { status: 'active', grantedAt: now, revokedAt: null }, $setOnInsert: { patientId: patient._id, recordId: record._id, doctorId: doctor._id } }
      : { $set: { status: 'revoked', revokedAt: now }, $setOnInsert: { patientId: patient._id, recordId: record._id, doctorId: doctor._id, grantedAt: now } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  ); } catch (error) {
    if (error.code !== 11000) throw error;
    permission = await Permission.findOneAndUpdate(
      { patientId: patient._id, recordId: record._id, doctorId: doctor._id },
      grant ? { $set: { status: 'active', grantedAt: now, revokedAt: null } } : { $set: { status: 'revoked', revokedAt: now } },
      { new: true, runValidators: true }
    );
  }
  await AccessLog.create({
    patientId: patient._id,
    doctorId: doctor._id,
    doctorName: `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim(),
    action: grant ? 'access_granted' : 'access_revoked',
    recordId: record._id,
    details: `${grant ? 'Granted' : 'Revoked'} access to record ${record._id} for Dr. ${doctor.firstName} ${doctor.lastName}`,
    ipAddress: req.ip
  });
  res.json({ success: true, data: { recordId: record._id, doctorId: doctor._id, status: permission.status } });
}

exports.getAuthorizedFile = asyncHandler(async (req, res) => {
  const patient = req.patient;
  const doctorId = req.user._id;
  const session = req.accessSession;

  if (session && session.permissions && session.permissions.viewRecords === false) {
    throw new ApiError(403, 'Patient restricted record viewing for this session');
  }

  const record = await MedicalRecord.findOne({ _id: req.params.recordId, userId: patient._id });
  if (!record) throw new ApiError(404, 'Record not found');

  if (record.isMaskedByPatient) {
    throw new ApiError(403, 'Record has been masked by patient');
  }

  // If session has excludeSensitive
  if (session && session.excludeSensitive && ['sensitive', 'strictly_confidential'].includes(record.sensitivity)) {
    throw new ApiError(403, 'Record is classified as sensitive and not accessible');
  }

  // If session is selective_records
  if (session && session.scopeType === 'selective_records' && session.allowedRecordIds?.length > 0) {
    const isAllowed = session.allowedRecordIds.some(id => String(id) === String(record._id));
    if (!isAllowed) throw new ApiError(403, 'Access to this record is not granted in the active consent scope');
  }

  // If session is category
  if (session && session.scopeType === 'category' && session.allowedCategories?.length > 0) {
    if (!session.allowedCategories.includes(record.category)) {
      throw new ApiError(403, 'Category of this record is not granted in the active consent scope');
    }
  }

  // Check DocumentAccessPermission
  const permCount = await Permission.countDocuments({ patientId: patient._id, doctorId });
  if (permCount > 0) {
    const permission = await Permission.exists({ patientId: patient._id, recordId: req.params.recordId, doctorId, status: 'active' });
    if (!permission) throw new ApiError(403, 'Document access has not been granted');
  }

  if (!record.filePublicId) throw new ApiError(404, 'No protected file is available for this record');

  // Audit Log
  await AccessLog.create({
    patientId: patient._id,
    doctorId,
    doctorName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
    action: 'viewed_single_record',
    recordId: record._id,
    recordTitle: record.title,
    details: `Doctor opened document: ${record.title}`,
    ipAddress: req.ip
  });

  const format = (record.fileType || '').includes('pdf') ? 'pdf' : undefined;
  const url = cloudinary.utils.private_download_url(record.filePublicId, format, { expires_at: Math.floor(Date.now() / 1000) + 300 });
  res.json({ success: true, data: { url, expiresInSeconds: 300 } });
});

exports.listDoctorRecords = asyncHandler(async (req, res) => {
  const patient = req.patient;
  const permissions = await Permission.find({ patientId: patient._id, doctorId: req.user._id, status: 'active' }).select('recordId');
  const ids = permissions.map((p) => p.recordId);
  const records = await MedicalRecord.find({ _id: { $in: ids }, userId: patient._id }).sort({ recordDate: -1 }).select('-fileUrl -filePublicId');
  res.json({ success: true, data: records });
});
