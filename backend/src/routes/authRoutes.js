const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateManager } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticateManager, authController.getMe);

module.exports = router;
