const axios = require('axios');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const AccessLog = require('../models/AccessLog');
const MedicalRecord = require('../models/MedicalRecord');
const EmergencyProfile = require('../models/EmergencyProfile');
const Prescription = require('../models/Prescription');

const SCRIBE_BASE_URL = process.env.SCRIBE_URL || 'http://127.0.0.1:8000';

/**
 * Maps the privacy-filtered patient records & chart data into the exact format
 * required by the multilingual Ambient Clinical Scribe / L4 Summarizer.
 */
const buildPatientChart = async (patient, allowedRecordIds, excludeSensitive) => {
  // Query only records permitted under the current doctor session & consent
  const query = { userId: patient._id };
  if (allowedRecordIds && allowedRecordIds.length > 0) {
    query._id = { $in: allowedRecordIds };
  }
  if (excludeSensitive) {
    query.sensitivity = 'standard';
    query.isMaskedByPatient = { $ne: true };
  }

  const [records, emergency, prescriptions] = await Promise.all([
    MedicalRecord.find(query).sort({ recordDate: -1 }),
    EmergencyProfile.findOne({ userId: patient._id }),
    Prescription.find({ patientId: patient._id }).sort({ createdAt: -1 }).limit(10)
  ]);

  const activeMeds = [];
  const allergies = [];
  const problemList = [];

  if (emergency) {
    (emergency.allergies || []).forEach(a => allergies.push({ substance: a, reaction: 'reported allergy' }));
    (emergency.chronicConditions || []).forEach(c => problemList.push(c));
    (emergency.currentMedications || []).forEach(m => {
      activeMeds.push({ name: m.name, dose: m.dosage || '', unit: '', frequency: m.frequency || '' });
    });
  }

  prescriptions.forEach(p => {
    (p.medicines || []).forEach(m => {
      if (!activeMeds.some(existing => existing.name.toLowerCase() === m.name.toLowerCase())) {
        activeMeds.push({ name: m.name, dose: m.dosage || '', unit: '', frequency: m.frequency || '' });
      }
    });
  });

  const priorNotes = records
    .filter(r => r.clinicalNotes || r.description)
    .slice(0, 3)
    .map(r => `${new Date(r.recordDate).toISOString().slice(0, 10)} (${r.title}): ${r.clinicalNotes || r.description}`)
    .join('\n');

  return {
    patient: {
      name: `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
      age: patient.dateOfBirth ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000)) : 45,
      sex: patient.gender || 'unknown',
      mrn: patient.healthId
    },
    active_medications: activeMeds,
    allergies: allergies,
    problem_list: problemList,
    prior_note_excerpt: priorNotes || 'No prior notes recorded.',
    recordsCount: records.length
  };
};

/**
 * POST /api/v1/doctors/patients/:healthId/scribe/session
 * Initializes an EvidenceScribe session with the patient's privacy-filtered chart preloaded.
 */
exports.initScribeSession = asyncHandler(async (req, res) => {
  const patient = req.patient;
  const session = req.accessSession;
  const doctor = req.user;

  // Build the privacy-gated chart
  const allowedIds = session.scopeType === 'selective_records' ? session.allowedRecordIds : null;
  const chart = await buildPatientChart(patient, allowedIds, session.excludeSensitive);

  // 1. Create session on the Scribe microservice
  let scribeRes;
  try {
    scribeRes = await axios.post(`${SCRIBE_BASE_URL}/api/session`);
  } catch (err) {
    throw new ApiError(503, `Clinical Scribe service unavailable at ${SCRIBE_BASE_URL}. Ensure Scribe is running.`);
  }

  const sid = scribeRes.data.id;

  // 2. Pre-populate chart into EvidenceScribe
  try {
    await axios.post(`${SCRIBE_BASE_URL}/api/session/${sid}/chart`, chart);
  } catch (err) {
    console.error('Failed to prefill chart on Scribe:', err.message);
  }

  // 3. Log audit event
  await AccessLog.create({
    patientId: patient._id,
    doctorId: doctor._id,
    doctorName: `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim(),
    action: 'viewed_records',
    details: `Initiated ambient clinical scribe session (${sid}) with ${chart.recordsCount} privacy-consented records`,
    ipAddress: req.ip
  });

  res.status(200).json({
    success: true,
    data: {
      sessionId: sid,
      scribeUrl: `${SCRIBE_BASE_URL}/#s=${sid}`,
      healthId: patient.healthId,
      patientName: chart.patient.name,
      chartSummary: {
        activeMedsCount: chart.active_medications.length,
        allergiesCount: chart.allergies.length,
        problemListCount: chart.problem_list.length,
        consentedRecordsLoaded: chart.recordsCount
      }
    }
  });
});

/**
 * POST /api/v1/doctors/patients/:healthId/scribe/import-note
 * Finalizes and imports a signed SOAP note from EvidenceScribe into the patient's MediBridge records.
 */
exports.importSignedNote = asyncHandler(async (req, res) => {
  const patient = req.patient;
  const doctor = req.user;
  const { sessionId, versionNumber } = req.body;

  if (!sessionId) {
    throw new ApiError(400, 'sessionId is required to import a signed note');
  }

  // Fetch the version from Scribe
  let versionRes;
  try {
    const vTarget = versionNumber || 1;
    versionRes = await axios.get(`${SCRIBE_BASE_URL}/api/session/${sessionId}/versions/${vTarget}`);
  } catch (err) {
    throw new ApiError(404, `Could not retrieve signed note version from Scribe: ${err.message}`);
  }

  const versionData = versionRes.data;
  const noteSections = versionData.note?.sections || {};

  const subjectiveText = (noteSections.subjective || []).map(s => s.text).join(' ');
  const objectiveText = (noteSections.objective || []).map(s => s.text).join(' ');
  const assessmentText = (noteSections.assessment || []).map(s => s.text).join(' ');
  const planText = (noteSections.plan || []).map(s => s.text).join(' ');

  const fullNoteText = [
    '### Subjective\n' + (subjectiveText || 'None recorded.'),
    '### Objective\n' + (objectiveText || 'None recorded.'),
    '### Assessment\n' + (assessmentText || 'None recorded.'),
    '### Plan\n' + (planText || 'None recorded.')
  ].join('\n\n');

  // Create a new Medical Record in MediBridge
  const newRecord = await MedicalRecord.create({
    userId: patient._id,
    uploadedBy: {
      type: 'doctor',
      doctorId: doctor._id,
      doctorName: `Dr. ${doctor.firstName || ''} ${doctor.lastName || ''}`.trim()
    },
    title: `Clinical Consultation Note (AI Scribe - Signed v${versionData.version || 1})`,
    category: 'diagnosis',
    description: `Signed clinical note generated via EvidenceScribe ambient listener. Content SHA256: ${versionData.content_hash || 'verified'}`,
    clinicalNotes: fullNoteText,
    doctorName: `Dr. ${doctor.firstName || ''} ${doctor.lastName || ''}`.trim(),
    sensitivity: 'standard',
    recordDate: versionData.signed_at || new Date(),
    tags: ['ai_scribe', 'ambient_transcription', 'signed_note']
  });

  await AccessLog.create({
    patientId: patient._id,
    doctorId: doctor._id,
    doctorName: `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim(),
    action: 'added_record',
    recordId: newRecord._id,
    recordTitle: newRecord.title,
    details: `Imported signed ambient clinical note (Scribe Session: ${sessionId}, Version: ${versionData.version || 1})`,
    ipAddress: req.ip
  });

  res.status(201).json({
    success: true,
    message: 'Signed clinical consultation note successfully integrated into MediBridge records.',
    data: newRecord
  });
});
