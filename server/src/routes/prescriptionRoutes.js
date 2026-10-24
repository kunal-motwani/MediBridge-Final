const express = require('express');
const { getMyPrescriptions, getActivePrescriptions, getPrescriptionById, markComplete } = require('../controllers/prescriptionController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('patient'));

router.get('/', getMyPrescriptions);
router.get('/active', getActivePrescriptions);
router.get('/:id', getPrescriptionById);
router.put('/:id/complete', markComplete);

module.exports = router;
