const express = require('express');
const { authRequired, requireRole } = require('../middlewares/auth');
const {
  adminSales,
  getProfile,
  login,
  register,
  updateProfile,
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authRequired, getProfile);
router.patch('/me', authRequired, updateProfile);
router.get('/admin/ventas', authRequired, requireRole('admin'), adminSales);

module.exports = router;
