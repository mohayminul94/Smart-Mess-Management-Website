const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateManager } = require('../middleware/auth');

router.use(authenticateManager);

router.get('/', paymentController.getPayments);
router.post('/', paymentController.createPayment);
router.patch('/:id/reverse', paymentController.reversePayment);

module.exports = router;
