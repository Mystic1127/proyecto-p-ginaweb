const svc = require('./facturas.service');

async function crearManual(req, res) {
  try {
    const out = await svc.crearFactura(req.body);
    res.status(201).json(out);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function listar(req, res) {
  try {
    const rows = await svc.listarFacturas({ rol: req.user.rol, idUsuario: req.user.id });
    res.json(rows);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function detalle(req, res) {
  try {
    const out = await svc.detalleFactura({
      rol: req.user.rol,
      idUsuario: req.user.id,
      id_factura: Number(req.params.id)
    });
    res.json(out);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
}

async function pagar(req, res) {
  try {
    const out = await svc.pagarFactura({
      id_factura: Number(req.params.id),
      metodo_pago: req.body?.metodo_pago
    });
    res.json(out);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function anular(req, res) {
  try {
    const out = await svc.anularFactura({
      id_factura: Number(req.params.id),
      observaciones: req.body?.observaciones
    });
    res.json(out);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function hookPorCita(req, res) {
  try {
    const out = await svc.crearFacturaPorCita({ id_cita: Number(req.params.id) });
    res.status(201).json(out);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function hookPorOrden(req, res) {
  try {
    const out = await svc.crearFacturaPorOrdenValidada({ id_orden: Number(req.params.id) });
    res.status(201).json(out);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

module.exports = {
  crearManual, listar, detalle, pagar, anular, hookPorCita, hookPorOrden
};
