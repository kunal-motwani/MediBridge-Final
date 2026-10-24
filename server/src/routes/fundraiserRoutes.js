const express = require('express');
const { createCampaign, getMyCampaigns, getCampaignBySlug, updateCampaign, donate, getCampaignDonors } = require('../controllers/fundraiserController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/campaigns/mine', protect, authorize('patient'), getMyCampaigns);
router.get('/campaigns/:slug', getCampaignBySlug);
router.post('/campaigns/:id/donations', donate);
router.get('/campaigns/:id/donors', getCampaignDonors);
router.post('/campaigns', protect, authorize('patient'), createCampaign);
router.put('/campaigns/:id', protect, authorize('patient'), updateCampaign);

module.exports = router;
