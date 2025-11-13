const express = require('express');
const router = express.Router();
const { authRequired, requireRole } = require('../../middlewares/auth.middleware');
const ctrl = require('./citas.controller');

router.use(authRequired);

router.get('/admin/all',
  requireRole(['ADMIN','RECEPCIONISTA','VETERINARIO']),
  ctrl.listar
);

router.put('/:id/estado',
  requireRole(['ADMIN','RECEPCIONISTA','VETERINARIO']),
  async (req, res) => {
    const { estado, nota } = req.body || {};
    if (estado === 'CONFIRMADA') return ctrl.confirmar(req, res);
    if (estado === 'ATENDIDA')   return ctrl.atender(req, res);
    if (estado === 'CANCELADA')  {
      req.body = { nota };
      return ctrl.cancelar(req, res);
    }
    return res.status(400).json({ error: 'Estado inválido' });
  }
);

router.post('/', ctrl.crear);
router.get('/', ctrl.listar);
router.get('/:id', ctrl.detalle);
router.put('/:id', ctrl.actualizar);
router.patch('/:id/confirmar', ctrl.confirmar);
router.patch('/:id/cancelar', ctrl.cancelar);
router.patch('/:id/atender',  ctrl.atender);

module.exports = router;
