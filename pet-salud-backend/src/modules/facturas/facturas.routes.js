const express = require('express');
const router = express.Router();
const { authRequired, requireRole } = require('../../middlewares/auth.middleware');
const factSvc = require('./facturas.service');

router.get('/_ping', (_req, res) => res.json({ ok: true, where: 'facturas' }));

router.post(
  '/hook/orden/:id',
  authRequired,
  requireRole(['ADMIN', 'RECEPCIONISTA']),
  async (req, res) => {
    try {
      const out = await factSvc.crearFacturaPorOrdenValidada({ id_orden: Number(req.params.id) });
      return res.status(201).json(out);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }
);

router.post(
  '/hook/cita/:id',
  authRequired,
  requireRole(['ADMIN', 'RECEPCIONISTA']),
  async (req, res) => {
    try {
      const out = await factSvc.crearFacturaPorCita({ id_cita: Number(req.params.id) });
      return res.status(201).json(out);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }
);

router.post(
  '/manual',
  authRequired,
  requireRole(['ADMIN', 'RECEPCIONISTA']),
  async (req, res) => {
    try {
      const out = await factSvc.crearFactura(req.body);
      return res.status(201).json(out);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }
);

router.get(
  '/',
  authRequired,
  async (req, res) => {
    try {
      const rows = await factSvc.listarFacturas({ rol: req.user.rol, idUsuario: req.user.id });
      return res.json(rows);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }
);

router.get(
  '/:id',
  authRequired,
  async (req, res) => {
    try {
      const row = await factSvc.detalleFactura({
        rol: req.user.rol,
        idUsuario: req.user.id,
        id_factura: Number(req.params.id)
      });
      return res.json(row);
    } catch (e) {
      return res.status(404).json({ error: e.message });
    }
  }
);

router.post(
  '/:id/pagar',
  authRequired,
  requireRole(['ADMIN', 'RECEPCIONISTA']),
  async (req, res) => {
    try {
      const out = await factSvc.pagarFactura({
        id_factura: Number(req.params.id),
        metodo_pago: req.body?.metodo_pago || 'EFECTIVO'
      });
      return res.json(out);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }
);

router.post(
  '/:id/anular',
  authRequired,
  requireRole(['ADMIN', 'RECEPCIONISTA']),
  async (req, res) => {
    try {
      const out = await factSvc.anularFactura({
        id_factura: Number(req.params.id),
        observaciones: req.body?.observaciones
      });
      return res.json(out);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }
);

module.exports = router;
