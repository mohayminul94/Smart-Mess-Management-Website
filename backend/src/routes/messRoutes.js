const express = require('express');
const router = express.Router();
const messController = require('../controllers/messController');
const { authenticateManager } = require('../middleware/auth');

router.use(authenticateManager);

router.get('/settings', messController.getMessSettings);
router.put('/settings', messController.updateMessSettings);
router.get('/period-status', messController.getMonthlyPeriodStatus);
router.post('/close-period', messController.closeMonthlyPeriod);
router.post('/reopen-period', messController.reopenMonthlyPeriod);

module.exports = router;
