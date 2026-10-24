const express = require('express');
const { checkEligibility, createLoanApplication, getMyApplications, getApplicationById } = require('../controllers/financialController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('patient'));

router.post('/eligibility', checkEligibility);
router.post('/loans', createLoanApplication);
router.get('/loans', getMyApplications);
router.get('/loans/:id', getApplicationById);

module.exports = router;
