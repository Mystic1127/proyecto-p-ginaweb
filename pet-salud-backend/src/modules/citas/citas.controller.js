const svc = require('./citas.service');
const factSvc = require('../facturas/facturas.service');

async function crear(req, res) {
  try {
    const out = await svc.crearCita({ rol: req.user.rol, idUsuario: req.user.id, body: req.body });
    res.status(201).json(out);
  } catch (err) { res.status(400).json({ error: err.message }); }
}

async function listar(req, res) {
  try {
    const rows = await svc.listarCitas(req.user.rol, req.user.id);
    res.json(rows);
  } catch (err) { res.status(400).json({ error: err.message }); }
}

async function detalle(req, res) {
  try {
    const row = await svc.detalleCita(req.user.rol, req.user.id, req.params.id);
    res.json(row);
  } catch (err) { res.status(404).json({ error: err.message }); }
}

async function actualizar(req, res) {
  try {
    const out = await svc.actualizarCita(req.user.rol, req.user.id, req.params.id, req.body);
    res.json(out);
  } catch (err) { res.status(400).json({ error: err.message }); }
}

async function confirmar(req, res) {
  try {
    const out = await svc.confirmarCita(req.user.rol, req.user.id, req.params.id);
    res.json(out);
  } catch (err) { res.status(400).json({ error: err.message }); }
}

async function cancelar(req, res) {
  try {
    const out = await svc.cancelarCita(req.user.rol, req.user.id, req.params.id, req.body?.nota);
    res.json(out);
  } catch (err) { res.status(400).json({ error: err.message }); }
}

async function atender(req, res) {
  try {
    const out = await svc.atenderCita(req.user.rol, req.user.id, req.params.id);
    try {
      const f = await factSvc.crearFacturaPorCita({ id_cita: req.params.id });
      return res.json({ ...out, factura_creada: f });
    } catch (e) {
      console.warn('No se pudo crear factura automática por cita:', e.message);
      return res.json(out);
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { crear, listar, detalle, actualizar, confirmar, cancelar, atender };
