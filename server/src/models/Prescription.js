const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  patientId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hospitalId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  diagnosis:   [{ type: String }],
  symptoms:    [{ type: String }],
  medicines: [{
    name:        { type: String, required: true },
    type:        { type: String, enum: ['tablet','capsule','syrup','injection','cream','drops','inhaler','other'] },
    dosage:      String,
    frequency:   String,
    duration:    String,
    timing:      { type: String, enum: ['before_meal','after_meal','empty_stomach','bedtime','as_needed'] },
    instructions: String,
    quantity:    Number,
  }],
  tests:       [{ type: String }],
  advice:      String,
  followUpDate: Date,
  vitals: { bloodPressure: String, heartRate: Number, temperature: Number, weight: Number, oxygenLevel: Number },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
