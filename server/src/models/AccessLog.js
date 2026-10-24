const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctorId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorName: String,
  action:    { 
    type: String, 
    enum: [
      'access_granted', 'viewed_records', 'viewed_single_record', 
      'viewed_prescriptions', 'added_record', 'added_prescription', 
      'access_revoked', 'access_expired'
    ], 
    required: true 
  },
  recordId:   { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord' },
  recordTitle: String,
  details:    String,
  ipAddress:  String,
}, { timestamps: true });

module.exports = mongoose.model('AccessLog', accessLogSchema);
