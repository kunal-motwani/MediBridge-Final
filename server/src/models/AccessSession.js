const mongoose = require('mongoose');

const accessSessionSchema = new mongoose.Schema({
  patientId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status:     { type: String, enum: ['active', 'expired', 'revoked'], default: 'active', index: true },
  expiresAt:  { type: Date, required: true },

  // NEW GRANULAR SCOPE FIELDS:
  scopeType: {
    type: String,
    enum: ['all', 'category', 'selective_records', 'date_range'],
    default: 'all'
  },
  
  // If scopeType == 'selective_records', only these records can be returned:
  allowedRecordIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalRecord'
  }],

  // If scopeType == 'category', only these categories can be returned:
  allowedCategories: [{
    type: String,
    enum: ['lab_report','prescription','discharge_summary','imaging','diagnosis','surgery_note','follow_up','invoice','other']
  }],

  // If scopeType == 'date_range':
  dateRange: {
    startDate: Date,
    endDate: Date
  },

  // Privacy Safeguards
  excludeSensitive: {
    type: Boolean,
    default: true // Automatically hides 'sensitive' and 'strictly_confidential' unless patient checked otherwise
  },

  // Permissions matrix
  permissions: {
    viewRecords:       { type: Boolean, default: true },
    viewPrescriptions: { type: Boolean, default: true },
    viewEmergency:     { type: Boolean, default: true },
    addRecords:        { type: Boolean, default: true },
    addPrescription:   { type: Boolean, default: true },
  },

  // Revocation Metadata
  revokedAt: Date,
  revokedReason: String,
}, { timestamps: true });

accessSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AccessSession', accessSessionSchema);
