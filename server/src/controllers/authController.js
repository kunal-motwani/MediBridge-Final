const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');

const sanitizeUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  healthId: user.healthId,
  doctorProfile: user.doctorProfile,
});

const issueTokens = async (user) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

const registerPatient = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone, dateOfBirth, gender, accessPin } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already registered');

  const user = await User.create({
    firstName, lastName, email, password, phone, dateOfBirth, gender, accessPin,
    role: 'patient',
  });

  const { accessToken, refreshToken } = await issueTokens(user);

  res.status(201).json({
    success: true,
    message: 'Patient registered successfully',
    data: { user: sanitizeUser(user), accessToken, refreshToken },
  });
});

const registerDoctor = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone, specialization, qualification, licenseNumber, experience, hospitalId } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already registered');

  const user = await User.create({
    firstName, lastName, email, password, phone,
    role: 'doctor',
    doctorProfile: {
      doctorId: 'DOC-' + Date.now().toString().slice(-8),
      specialization, qualification, licenseNumber, experience,
      hospitalId: hospitalId || undefined,
    },
  });

  const { accessToken, refreshToken } = await issueTokens(user);

  res.status(201).json({
    success: true,
    message: 'Doctor registered successfully. Verification pending.',
    data: { user: sanitizeUser(user), accessToken, refreshToken },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const { accessToken, refreshToken } = await issueTokens(user);

  res.json({
    success: true,
    message: 'Login successful',
    data: { user: sanitizeUser(user), accessToken, refreshToken },
  });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, 'Refresh token expired or invalid');
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    throw new ApiError(401, 'Refresh token not recognized');
  }

  const accessToken = generateAccessToken(user._id);

  res.json({ success: true, message: 'Token refreshed', data: { accessToken } });
});

const logout = asyncHandler(async (req, res) => {
  req.user.refreshToken = undefined;
  await req.user.save({ validateBeforeSave: false });
  res.json({ success: true, message: 'Logged out successfully', data: {} });
});

module.exports = { registerPatient, registerDoctor, login, refresh, logout };
