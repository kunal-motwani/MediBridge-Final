const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  uploadedBy: {
    type:         { type: String, enum: ['self', 'doctor', 'hospital_fetch'], required: true },
    doctorId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    doctorName:   String,
    hospitalId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    hospitalName: String,
  },
  title:         { type: String, required: true },
  category:      { type: String, enum: ['lab_report','prescription','discharge_summary','imaging','diagnosis','surgery_note','follow_up','invoice','other'], required: true },
  description:   String,
  clinicalNotes: String,
  diagnosis:     [{ type: String }],
  vitals: {
    bloodPressure: String, heartRate: Number, temperature: Number, weight: Number, oxygenLevel: Number,
  },
  fileUrl:       String,
  filePublicId:  String,
  fileType:      String,
  fileSize:      Number,
  hospitalName:  String,
  doctorName:    String,
  // Granular Privacy Fields
  sensitivity: {
    type: String,
    enum: ['standard', 'sensitive', 'strictly_confidential'],
    default: 'standard',
    index: true
  },
  department: {
    type: String,
    enum: [
      'general_medicine', 'cardiology', 'orthopedics', 'pediatrics',
      'dermatology', 'psychiatry', 'neurology', 'gynecology', 'oncology', 'other'
    ],
    default: 'general_medicine',
    index: true
  },
  isMaskedByPatient: {
    type: Boolean,
    default: false
  },
  recordDate:    { type: Date, default: Date.now },
  tags:          [{ type: String }],
  isPrivate:     { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
