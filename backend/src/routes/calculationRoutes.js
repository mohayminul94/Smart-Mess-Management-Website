const express = require('express');
const router = express.Router();
const calculationController = require('../controllers/calculationController');
const { authenticateManager } = require('../middleware/auth');

router.use(authenticateManager);

router.get('/monthly', calculationController.getMonthlyCalculations);
router.get('/dashboard', calculationController.getDashboardData);
router.get('/reports', calculationController.getMonthlyReports);

module.exports = router;
