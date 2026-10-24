const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  campaignId:   { type: mongoose.Schema.Types.ObjectId, ref: 'FundraiserCampaign', required: true },
  donorName:    { type: String, default: 'Anonymous' },
  donorEmail:   String,
  donorPhone:   String,
  isAnonymous:  { type: Boolean, default: false },
  amount:       { type: Number, required: true },
  paymentMethod: { type: String, enum: ['upi', 'card', 'netbanking', 'wallet'] },
  transactionId: String,
  status:       { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'completed' },
  message:      String,
}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema);
