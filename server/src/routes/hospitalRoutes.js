const express = require('express');
const { getHospitals, getHospitalById, searchHospitals } = require('../controllers/hospitalController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/search', searchHospitals);
router.get('/', getHospitals);
router.get('/:id', getHospitalById);

module.exports = router;
