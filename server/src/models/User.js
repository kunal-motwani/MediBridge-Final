const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  phone: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
  },
  avatar: { type: String },

  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },

  // Health ID (patients only) — auto-generated, unique. Format: "MB-2026-XXXXXX"
  healthId: { type: String, unique: true, sparse: true },
  // Explicit patient assignment; must be populated by a trusted assignment workflow.
  assignedDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },

  // Access PIN (patients only) — 4-digit, bcrypt hashed
  accessPin: { type: String, select: false },

  // Doctor profile (doctors only)
  doctorProfile: {
    doctorId: String,
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    specialization: String,
    qualification: String,
    licenseNumber: String,
    experience: Number,
    isVerified: { type: Boolean, default: false },
  },

  refreshToken: { type: String, select: false },
}, { timestamps: true });

// Auto-generate a collision-free Health ID for patients before anything else runs
userSchema.pre('save', async function () {
  if (this.role !== 'patient' || this.healthId) return;

  let id;
  let exists = true;
  while (exists) {
    id = 'MB-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000);
    exists = await this.constructor.exists({ healthId: id });
  }
  this.healthId = id;
});

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

userSchema.pre('save', async function () {
  if (this.isModified('accessPin') && this.accessPin) {
    this.accessPin = await bcrypt.hash(this.accessPin, 10);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.verifyPin = async function (enteredPin) {
  return bcrypt.compare(enteredPin, this.accessPin);
};

module.exports = mongoose.model('User', userSchema);
