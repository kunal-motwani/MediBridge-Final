const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  type:          { type: String, enum: ['government', 'private', 'ngo', 'clinic'] },
  specializations: [{ type: String }],
  address: {
    street:  String,
    city:    { type: String, required: true, index: true },
    state:   { type: String, required: true },
    pincode: String,
    coordinates: { lat: Number, lng: Number },
  },
  phone:         String,
  email:         String,
  website:       String,
  rating:        { type: Number, default: 0, min: 0, max: 5 },
  totalBeds:     Number,
  emergencyAvailable: { type: Boolean, default: false },
  insuranceAccepted: [{ type: String }],
  imageUrl:      String,
  isVerified:    { type: Boolean, default: false },
}, { timestamps: true });

hospitalSchema.index({ name: 'text', 'address.city': 'text', specializations: 'text' });

module.exports = mongoose.model('Hospital', hospitalSchema);
