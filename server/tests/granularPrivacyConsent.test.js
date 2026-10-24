const { before, after, test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../src/models/User');
const MedicalRecord = require('../src/models/MedicalRecord');
const AccessSession = require('../src/models/AccessSession');
const AccessLog = require('../src/models/AccessLog');
const ConsentGrant = require('../src/models/ConsentGrant');
const app = require('../src/app');

let mongo, server, base, patient, doctor, patientToken, doctorToken;
let standardRecord, sensitiveRecord, confidentialRecord, maskedRecord, prescriptionRecord;

const auth = (token) => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });

before(async () => {
  process.env.JWT_SECRET = 'granular-privacy-test-secret';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  patient = await User.create({
    firstName: 'Aarav',
    lastName: 'Sharma',
    email: 'aarav@example.test',
    password: 'password123',
    role: 'patient',
    accessPin: '1234'
  });

  doctor = await User.create({
    firstName: 'Priya',
    lastName: 'Nair',
    email: 'dr.priya@example.test',
    password: 'password123',
    role: 'doctor'
  });

  patientToken = jwt.sign({ id: patient._id }, process.env.JWT_SECRET);
  doctorToken = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET);

  // Create records with varying sensitivities, categories, and mask states
  standardRecord = await MedicalRecord.create({
    userId: patient._id,
    title: 'Routine Blood Panel',
    category: 'lab_report',
    department: 'general_medicine',
    sensitivity: 'standard',
    uploadedBy: { type: 'self' }
  });

  sensitiveRecord = await MedicalRecord.create({
    userId: patient._id,
    title: 'Psychiatric Evaluation',
    category: 'diagnosis',
    department: 'psychiatry',
    sensitivity: 'sensitive',
    uploadedBy: { type: 'self' }
  });

  confidentialRecord = await MedicalRecord.create({
    userId: patient._id,
    title: 'Reproductive Health Screening',
    category: 'lab_report',
    department: 'gynecology',
    sensitivity: 'strictly_confidential',
    uploadedBy: { type: 'self' }
  });

  maskedRecord = await MedicalRecord.create({
    userId: patient._id,
    title: 'Historic Surgery Note',
    category: 'surgery_note',
    department: 'orthopedics',
    sensitivity: 'standard',
    isMaskedByPatient: true,
    uploadedBy: { type: 'self' }
  });

  prescriptionRecord = await MedicalRecord.create({
    userId: patient._id,
    title: 'Cardiology Medication Chart',
    category: 'prescription',
    department: 'cardiology',
    sensitivity: 'standard',
    uploadedBy: { type: 'self' }
  });

  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api/v1`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test('1. Patient can update record sensitivity and mask state via /records/:id/privacy', async () => {
  const res = await fetch(`${base}/records/${standardRecord._id}/privacy`, {
    method: 'PUT',
    headers: auth(patientToken),
    body: JSON.stringify({ sensitivity: 'sensitive', isMaskedByPatient: false })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.data.sensitivity, 'sensitive');

  // Revert back for remaining tests
  await fetch(`${base}/records/${standardRecord._id}/privacy`, {
    method: 'PUT',
    headers: auth(patientToken),
    body: JSON.stringify({ sensitivity: 'standard' })
  });
});

test('2. Doctor access via default PIN excludes sensitive and masked records', async () => {
  // Doctor requests access with master PIN
  const accessRes = await fetch(`${base}/doctors/patients/access`, {
    method: 'POST',
    headers: auth(doctorToken),
    body: JSON.stringify({ healthId: patient.healthId, accessPin: '1234' })
  });
  assert.equal(accessRes.status, 201);

  // Doctor fetches patient records
  const recordsRes = await fetch(`${base}/doctors/patients/${patient.healthId}/records`, {
    headers: auth(doctorToken)
  });
  assert.equal(recordsRes.status, 200);
  const body = await recordsRes.json();

  // Total patient records is 5, but sensitive and masked are excluded
  assert.equal(body.meta.isFiltered, true);
  assert.equal(body.meta.totalPatientRecords, 5);
  // Only standardRecord and prescriptionRecord should be returned
  const titles = body.data.map((r) => r.title);
  assert.ok(titles.includes('Routine Blood Panel'));
  assert.ok(titles.includes('Cardiology Medication Chart'));
  assert.ok(!titles.includes('Psychiatric Evaluation'));
  assert.ok(!titles.includes('Reproductive Health Screening'));
  assert.ok(!titles.includes('Historic Surgery Note'));
});

test('3. Scoped 1-time PIN consent: selective records only', async () => {
  // Patient generates a 1-time custom PIN for ONLY Routine Blood Panel
  const grantRes = await fetch(`${base}/access/grant`, {
    method: 'POST',
    headers: auth(patientToken),
    body: JSON.stringify({
      generatePin: true,
      scopeType: 'selective_records',
      allowedRecordIds: [standardRecord._id],
      durationHours: 1,
      excludeSensitive: true
    })
  });
  assert.equal(grantRes.status, 201);
  const grantData = await grantRes.json();
  const customPin = grantData.data.pin;
  assert.ok(customPin && customPin.length === 4);

  // Doctor redeems this 1-time scoped PIN
  const verifyRes = await fetch(`${base}/doctors/patients/access`, {
    method: 'POST',
    headers: auth(doctorToken),
    body: JSON.stringify({ healthId: patient.healthId, accessPin: customPin })
  });
  assert.equal(verifyRes.status, 201);

  // Doctor fetches patient records
  const recordsRes = await fetch(`${base}/doctors/patients/${patient.healthId}/records`, {
    headers: auth(doctorToken)
  });
  assert.equal(recordsRes.status, 200);
  const body = await recordsRes.json();

  // Exactly 1 record should be returned
  assert.equal(body.data.length, 1);
  assert.equal(body.data[0].title, 'Routine Blood Panel');
  assert.equal(body.meta.scopeType, 'selective_records');
});

test('4. Scoped consent: category filtering (lab_report only)', async () => {
  // Patient grants direct consent for category: lab_report
  const grantRes = await fetch(`${base}/access/grant`, {
    method: 'POST',
    headers: auth(patientToken),
    body: JSON.stringify({
      doctorId: doctor._id,
      scopeType: 'category',
      allowedCategories: ['lab_report'],
      excludeSensitive: true,
      durationHours: 4
    })
  });
  assert.equal(grantRes.status, 201);

  // Doctor fetches records under this active session
  const recordsRes = await fetch(`${base}/doctors/patients/${patient.healthId}/records`, {
    headers: auth(doctorToken)
  });
  assert.equal(recordsRes.status, 200);
  const body = await recordsRes.json();

  // Routine Blood Panel is standard lab_report -> returned.
  // Reproductive Health Screening is lab_report BUT strictly_confidential -> excluded!
  assert.equal(body.data.length, 1);
  assert.equal(body.data[0].title, 'Routine Blood Panel');
});

test('5. Instant Revocation terminates active doctor session immediately', async () => {
  // Get active sessions for patient
  const sessionsRes = await fetch(`${base}/access/active-sessions`, {
    headers: auth(patientToken)
  });
  assert.equal(sessionsRes.status, 200);
  const sessions = (await sessionsRes.json()).data;
  assert.ok(sessions.length > 0);
  const activeSession = sessions[0];

  // Patient revokes session
  const revokeRes = await fetch(`${base}/access/sessions/${activeSession._id}/revoke`, {
    method: 'PUT',
    headers: auth(patientToken),
    body: JSON.stringify({ reason: 'Consultation concluded' })
  });
  assert.equal(revokeRes.status, 200);

  // Immediate subsequent doctor request must be rejected with 403 Forbidden
  const doctorCheck = await fetch(`${base}/doctors/patients/${patient.healthId}/records`, {
    headers: auth(doctorToken)
  });
  assert.equal(doctorCheck.status, 403);

  // Verify audit log has access_revoked entry
  const logsRes = await fetch(`${base}/access/log`, {
    headers: auth(patientToken)
  });
  const logs = (await logsRes.json()).data;
  const revokedLog = logs.find((l) => l.action === 'access_revoked');
  assert.ok(revokedLog);
  assert.equal(revokedLog.details, 'Consultation concluded');
});
