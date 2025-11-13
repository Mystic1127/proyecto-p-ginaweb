const express = require('express');
const router = express.Router();
const { authRequired, requireRole } = require('../../middlewares/auth.middleware');
const ctrl = require('./staff.controller');

router.use(authRequired);

// Perfil propio (solo VETERINARIO/TECNICO)
router.get('/me', ctrl.me);
router.put('/me', ctrl.updateMe);

// Administración (solo ADMIN)
router.get('/veterinarios', requireRole(['ADMIN']), ctrl.listVeterinarios);
router.get('/tecnicos', requireRole(['ADMIN']), ctrl.listTecnicos);
router.get('/recepcionistas', requireRole(['ADMIN']), ctrl.listRecepcionistas);
router.get('/admins', requireRole(['ADMIN']), ctrl.listAdmins);
router.get('/vets-public', authRequired, ctrl.listVeterinariosPublic);

module.exports = router;
