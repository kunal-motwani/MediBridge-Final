const mongoose = require('mongoose');

const loanApplicationSchema = new mongoose.Schema({
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hospitalId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  treatmentType:    { type: String, required: true },
  estimatedCost:    { type: Number, required: true },
  amountRequested:  { type: Number, required: true },
  monthlyIncome:      Number,
  coapplicantIncome:  Number,
  existingEMIs:       Number,
  employmentType:     { type: String, enum: ['salaried', 'self_employed', 'unemployed'] },
  creditHistory:      Boolean,
  mlScore:          Number,
  ruleScore:        Number,
  approvedAmount:   Number,
  interestRate:     Number,
  tenure:           Number,
  emi:              Number,
  status:           { type: String, enum: ['draft','submitted','under_review','approved','partial','rejected','disbursed'], default: 'draft' },
  supportingDocs:   [{ type: String }],
  purpose:          String,
  notes:            String,
}, { timestamps: true });

module.exports = mongoose.model('LoanApplication', loanApplicationSchema);
