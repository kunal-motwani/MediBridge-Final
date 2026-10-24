const mongoose = require('mongoose');

const emergencyProfileSchema = new mongoose.Schema({
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bloodGroup:       { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
  allergies:        [{ type: String }],
  chronicConditions:[{ type: String }],
  currentMedications:[{
    name:      String,
    dosage:    String,
    frequency: String,
  }],
  emergencyContacts: [{
    name:         String,
    relationship: String,
    phone:        String,
  }],
  insuranceProvider: { type: String },
  insurancePolicyNo: { type: String },
  organDonor:       { type: Boolean, default: false },
  notes:            { type: String },
}, { timestamps: true });

module.exports = mongoose.model('EmergencyProfile', emergencyProfileSchema);
