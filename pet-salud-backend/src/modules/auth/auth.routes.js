const express = require('express');
const router = express.Router();

const { register, loginUser, registerStaff } = require('./auth.controller');
const { authRequired, requireRole } = require('../../middlewares/auth.middleware');

router.post('/register', register);

router.post('/login', loginUser);

router.post(
  '/staff',
  authRequired,
  requireRole(['ADMIN']),
  registerStaff
);

module.exports = router;
