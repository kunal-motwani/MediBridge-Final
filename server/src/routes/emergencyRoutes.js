const express = require('express');
const EmergencyProfile = require('../models/EmergencyProfile');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/:healthId', asyncHandler(async (req, res) => {
  const user = await User.findOne({ healthId: req.params.healthId });
  if (!user) throw new ApiError(404, 'User not found');

  const profile = await EmergencyProfile.findOne({ userId: user._id });
  if (!profile) throw new ApiError(404, 'Emergency profile not found');

  res.status(200).json({
    success: true,
    data: {
      name: `${user.firstName} ${user.lastName}`,
      bloodGroup: profile.bloodGroup,
      allergies: profile.allergies,
      chronicConditions: profile.chronicConditions,
      currentMedications: profile.currentMedications,
      emergencyContacts: profile.emergencyContacts,
      organDonor: profile.organDonor
    }
  });
}));

module.exports = router;
