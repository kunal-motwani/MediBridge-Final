const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  specialization: { type: String, required: true },
  qualification:  String,
  experience:     Number,
  hospitalId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  consultationFee: Number,
  availability: {
    days:  [{ type: String }],
    hours: String,
  },
  rating:         { type: Number, default: 0, min: 0, max: 5 },
  imageUrl:       String,
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
