const express = require('express');
const router = express.Router();
const { authRequired } = require('../../middlewares/auth.middleware');
const ctrl = require('./mascotas.controller');

router.use(authRequired);

router.post('/', ctrl.create);
router.get('/', ctrl.listMine);
router.get('/:id', ctrl.getOne);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
