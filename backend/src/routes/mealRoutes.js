const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');
const { authenticateManager } = require('../middleware/auth');

router.use(authenticateManager);

router.get('/daily', mealController.getMealsByDate);
router.post('/bulk', mealController.saveBulkMeals);
router.get('/summary', mealController.getMonthlyMealSummary);

module.exports = router;
