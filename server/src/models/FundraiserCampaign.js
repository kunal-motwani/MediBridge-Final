const mongoose = require('mongoose');

const fundraiserSchema = new mongoose.Schema({
  patientId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  loanApplicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'LoanApplication' },
  title:           { type: String, required: true },
  story:           { type: String, required: true },
  coverImage:      String,
  totalRequired:   { type: Number, required: true },
  loanApproved:    { type: Number, default: 0 },
  fundingGap:      { type: Number, required: true },
  amountRaised:    { type: Number, default: 0 },
  treatmentType:   String,
  hospitalName:    String,
  doctorName:      String,
  isVerified:      { type: Boolean, default: false },
  medicalProof:    [{ type: String }],
  status:          { type: String, enum: ['draft','pending_verification','active','funded','closed','expired'], default: 'draft' },
  deadline:        Date,
  shareSlug:       { type: String, unique: true },
}, { timestamps: true });

module.exports = mongoose.model('FundraiserCampaign', fundraiserSchema);
