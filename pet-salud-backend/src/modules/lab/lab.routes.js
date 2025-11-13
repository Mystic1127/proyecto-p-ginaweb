const express = require('express');
const router = express.Router();
const { authRequired } = require('../../middlewares/auth.middleware');
const ctrl = require('./lab.controller');

router.use(authRequired);

// DUENO o VETERINARIO: crear orden
router.post('/orden', ctrl.crearOrden);

// TECNICO/VETERINARIO/ADMIN: toma de muestra
router.post('/toma', ctrl.tomaMuestra);

// TECNICO/ADMIN: registrar resultado
router.post('/resultado', ctrl.registrarResultado);

// VETERINARIO/ADMIN: validar resultado
router.post('/validar', ctrl.validar);

// Listar / detalle (DUENO: solo suyas; STAFF: todas)
router.get('/ordenes', ctrl.listar);
router.get('/ordenes/:id', ctrl.detalle);

// Generar PDF del informe
router.get('/informe/:id', ctrl.informe);

// Validar QR por query
router.get('/validar-qr', ctrl.validarQR);

module.exports = router;

