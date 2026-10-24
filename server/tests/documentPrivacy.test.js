const { before, after, test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../src/models/User');
const MedicalRecord = require('../src/models/MedicalRecord');
const AccessSession = require('../src/models/AccessSession');
const Permission = require('../src/models/DocumentAccessPermission');
const app = require('../src/app');

let mongo, server, base, patient, otherPatient, doctor, patientToken, otherToken, doctorToken, shared, privateRecord;
const auth = (token) => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });

before(async () => {
  process.env.JWT_SECRET = 'document-privacy-test-secret';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  patient = await User.create({ firstName: 'Pat', lastName: 'One', email: 'pat@example.test', password: 'password123', role: 'patient' });
  otherPatient = await User.create({ firstName: 'Pat', lastName: 'Two', email: 'pat2@example.test', password: 'password123', role: 'patient' });
  doctor = await User.create({ firstName: 'Doc', lastName: 'One', email: 'doc@example.test', password: 'password123', role: 'doctor' });
  await User.updateOne({ _id: patient._id }, { assignedDoctorId: doctor._id });
  patientToken = jwt.sign({ id: patient._id }, process.env.JWT_SECRET);
  otherToken = jwt.sign({ id: otherPatient._id }, process.env.JWT_SECRET);
  doctorToken = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET);
  shared = await MedicalRecord.create({ userId: patient._id, title: 'Shared', category: 'lab_report', uploadedBy: { type: 'self' }, filePublicId: 'private/test' });
  privateRecord = await MedicalRecord.create({ userId: patient._id, title: 'Private', category: 'diagnosis', uploadedBy: { type: 'self' }, filePublicId: 'private/test2' });
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api/v1`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test('patient can grant and revoke only their own record; doctor listing and file access require an active grant', async () => {
  const otherAttempt = await fetch(`${base}/document-access/${shared._id}/grant`, { method: 'PUT', headers: auth(otherToken) });
  assert.equal(otherAttempt.status, 404);
  const grant = await fetch(`${base}/document-access/${shared._id}/grant`, { method: 'PUT', headers: auth(patientToken) });
  assert.equal(grant.status, 200);
  await AccessSession.create({ patientId: patient._id, doctorId: doctor._id, expiresAt: new Date(Date.now() + 60000) });
  let list = await fetch(`${base}/doctors/patients/${patient.healthId}/records`, { headers: auth(doctorToken) });
  assert.deepEqual((await list.json()).data.map((r) => String(r._id)), [String(shared._id)]);
  const sessionAloneFile = await fetch(`${base}/doctors/patients/${patient.healthId}/records/${privateRecord._id}/file`, { headers: auth(doctorToken) });
  assert.equal(sessionAloneFile.status, 403);
  const revoke = await fetch(`${base}/document-access/${shared._id}/revoke`, { method: 'PUT', headers: auth(patientToken) });
  assert.equal(revoke.status, 200);
  list = await fetch(`${base}/doctors/patients/${patient.healthId}/records`, { headers: auth(doctorToken) });
  assert.deepEqual((await list.json()).data, []);
  const revokedFile = await fetch(`${base}/doctors/patients/${patient.healthId}/records/${shared._id}/file`, { headers: auth(doctorToken) });
  assert.equal(revokedFile.status, 403);
  assert.equal(await Permission.countDocuments({ patientId: patient._id, recordId: shared._id }), 1);
});

test('new and pre-existing records receive no automatic permission; one grant stays document-specific', async () => {
  const newlyUploaded = await MedicalRecord.create({ userId: patient._id, title: 'New', category: 'imaging', uploadedBy: { type: 'self' } });
  assert.equal(newlyUploaded.isPrivate, true);
  assert.equal(await Permission.countDocuments({ patientId: patient._id, recordId: privateRecord._id }), 0);
  assert.equal(await Permission.countDocuments({ patientId: patient._id, recordId: newlyUploaded._id }), 0);
});
