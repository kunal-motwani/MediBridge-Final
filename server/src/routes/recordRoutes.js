const express = require('express');
const { getRecords, getPatientOwnAiSummary, getRecordById, createRecord, updateRecord, updateRecordPrivacy, deleteRecord, fetchFromHospital } = require('../controllers/recordController');
const cloudinary = require('../config/cloudinary');
const MedicalRecord = require('../models/MedicalRecord');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);
router.use(authorize('patient'));

router.get('/', getRecords);
router.get('/ai-summary', getPatientOwnAiSummary);
router.post('/', upload.single('file'), createRecord);
router.post('/fetch-from-hospital', fetchFromHospital);
router.get('/:id', getRecordById);
router.get('/:id/file', asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findOne({ _id: req.params.id, userId: req.user._id }).select('filePublicId fileType');
  if (!record) throw new ApiError(404, 'Record not found');
  if (!record.filePublicId) throw new ApiError(404, 'No protected file is available for this record');
  const format = (record.fileType || '').includes('pdf') ? 'pdf' : undefined;
  const url = cloudinary.utils.private_download_url(record.filePublicId, format, { expires_at: Math.floor(Date.now() / 1000) + 300 });
  res.json({ success: true, data: { url, expiresInSeconds: 300 } });
}));
router.put('/:id/privacy', updateRecordPrivacy);
router.put('/:id', updateRecord);
router.delete('/:id', deleteRecord);

module.exports = router;
