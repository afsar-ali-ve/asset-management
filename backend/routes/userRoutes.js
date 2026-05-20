const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');
const { getProfile, getAssignableUsers, updateProfile, changePassword } = require('../controllers/userController');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getAssignableUsers);
router.get('/profile', getProfile);
router.get('/assignable-users', getAssignableUsers);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

module.exports = router;
