const express = require('express');
const router = express.Router();
const { authRequired, requireRole } = require('../../middlewares/auth.middleware');
const ctrl = require('./reportes.controller');

router.use(authRequired, requireRole(['ADMIN','RECEPCIONISTA','VETERINARIO']));
router.get('/ingresos', ctrl.getIngresos);
router.get('/citas', ctrl.getCitasStats);
router.get('/servicios-top', ctrl.getTopServicios);
router.get('/ventas-examen', ctrl.getVentasExamen);

module.exports = router;
