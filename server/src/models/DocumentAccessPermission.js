const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recordId: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'revoked'], default: 'active', required: true },
  grantedAt: { type: Date, required: true, default: Date.now },
  revokedAt: { type: Date, default: null },
}, { timestamps: true });

// One durable row per patient/document/assigned doctor. Atomic updates make grant/revoke idempotent.
schema.index({ patientId:  1, recordId: 1, doctorId: 1 }, { unique: true });
schema.index({ doctorId: 1, status: 1, recordId: 1 });

module.exports = mongoose.model('DocumentAccessPermission', schema);
