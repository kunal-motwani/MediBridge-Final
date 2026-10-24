const express = require('express');
const { getAccessLog, getActiveSessions, revokeSession, grantAccess, getDoctors } = require('../controllers/accessController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('patient'));

router.post('/grant', grantAccess);
router.get('/active-sessions', getActiveSessions);
router.get('/sessions', getActiveSessions);
router.put('/sessions/:id/revoke', revokeSession);
router.get('/log', getAccessLog);
router.get('/doctors', getDoctors);

module.exports = router;
