const mongoose = require('mongoose');

const consentGrantSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  accessPin: { type: String, required: true }, // 4-digit PIN for custom consent
  scopeType: {
    type: String,
    enum: ['all', 'category', 'selective_records', 'date_range'],
    default: 'all'
  },
  allowedRecordIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalRecord'
  }],
  allowedCategories: [{
    type: String,
    enum: ['lab_report','prescription','discharge_summary','imaging','diagnosis','surgery_note','follow_up','invoice','other']
  }],
  dateRange: {
    startDate: Date,
    endDate: Date
  },
  excludeSensitive: {
    type: Boolean,
    default: true
  },
  durationHours: {
    type: Number,
    default: 24
  },
  permissions: {
    viewRecords:       { type: Boolean, default: true },
    viewPrescriptions: { type: Boolean, default: true },
    viewEmergency:     { type: Boolean, default: true },
    addRecords:        { type: Boolean, default: true },
    addPrescription:   { type: Boolean, default: true },
  },
  status: {
    type: String,
    enum: ['pending', 'used', 'expired', 'revoked'],
    default: 'pending',
    index: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, { timestamps: true });

consentGrantSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('ConsentGrant', consentGrantSchema);
