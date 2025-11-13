const express = require('express');
const router = express.Router();
const { authRequired, requireRole } = require('../../middlewares/auth.middleware');
const ctrl = require('./duenos.controller');

router.use(authRequired);

// Perfil propio
router.get('/me', ctrl.me);
router.put('/me', ctrl.updateMe);

router.get('/',
  requireRole(['ADMIN', 'RECEPCIONISTA']),
  ctrl.list
);

router.get('/:id',
  requireRole(['ADMIN', 'RECEPCIONISTA']),
  ctrl.getOne
);

router.post('/',
  requireRole(['ADMIN', 'RECEPCIONISTA']),
  ctrl.createForUser
);

router.put('/:id',
  requireRole(['ADMIN', 'RECEPCIONISTA']),
  ctrl.updateById
);

module.exports = router;
