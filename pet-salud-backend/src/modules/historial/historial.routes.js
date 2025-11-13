const express = require('express');
const router = express.Router();

const { authRequired, requireRole } = require('../../middlewares/auth.middleware');

const controller = require('./historial.controller');

router.post('/', authRequired, requireRole(['VETERINARIO']), controller.crear);
router.get('/mascota/:idMascota', authRequired, requireRole(['VETERINARIO','ADMIN']), controller.listarPorMascota);
router.get('/:id', authRequired, requireRole(['VETERINARIO','ADMIN']), controller.obtener);
router.put('/:id', authRequired, requireRole(['VETERINARIO']), controller.actualizar);
router.get('/cita/:idCita/existe', authRequired, requireRole(['VETERINARIO','ADMIN']), controller.existePorCita);

module.exports = router;
