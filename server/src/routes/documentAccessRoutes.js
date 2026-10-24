const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { listMyAccess, setAssignedDoctor, grant, revoke } = require('../controllers/documentAccessController');

const router = express.Router();

router.use(protect, authorize('patient'));

router.get('/me', listMyAccess);
router.post('/assign-doctor', setAssignedDoctor);
router.put('/:recordId/grant', grant);
router.put('/:recordId/revoke', revoke);

module.exports = router;
