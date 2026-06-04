const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');
const {
  getProfile,
  getAssignableUsers,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  updateProfile,
  changePassword,
} = require('../controllers/userController');

const router = express.Router();

router.use(authenticateToken);

router.get('/profile', getProfile);
router.get('/assignable-users', getAssignableUsers);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.get('/', requireAdmin, getUsers);
router.post('/', requireAdmin, createUser);
router.put('/:id/role', requireAdmin, updateUserRole);
router.put('/:id', requireAdmin, updateUser);
router.delete('/:id', requireAdmin, deleteUser);

module.exports = router;
