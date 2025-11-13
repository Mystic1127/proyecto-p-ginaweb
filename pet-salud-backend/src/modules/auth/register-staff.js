const { registerStaff } = require('./auth.controller');
const { authRequired, requireRole } = require('../../middlewares/auth.middleware');

router.post('/register', register);
router.post('/login', loginUser);

router.post(
  '/register-staff',
  authRequired,
  requireRole(['ADMIN']),
  registerStaff
);

module.exports = router;
