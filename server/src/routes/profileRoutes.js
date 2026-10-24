const express = require('express');
const { getProfile, updateProfile, updateAvatar, getEmergencyProfile, updateEmergencyProfile, changeAccessPin, getHealthIdData } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

router.get('/me', getProfile);
router.put('/me', updateProfile);
router.put('/me/avatar', upload.single('avatar'), updateAvatar);
router.get('/emergency', getEmergencyProfile);
router.put('/emergency', updateEmergencyProfile);
router.put('/access-pin', changeAccessPin);
router.get('/health-id', getHealthIdData);

module.exports = router;
