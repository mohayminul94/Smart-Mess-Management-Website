const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { authenticateManager } = require('../middleware/auth');

router.use(authenticateManager);

router.get('/', memberController.getMembers);
router.post('/', memberController.createMember);
router.put('/:id', memberController.updateMember);
router.patch('/:id/toggle-status', memberController.toggleMemberStatus);
router.get('/:id/statement', memberController.getMemberStatement);

module.exports = router;
