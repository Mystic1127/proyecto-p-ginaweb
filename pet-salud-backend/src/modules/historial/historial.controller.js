const service = require('./historial.service');

async function crear(req, res) {
  try {
    const result = await service.crearHistorial(req.user.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function listarPorMascota(req, res) {
  try {
    const rows = await service.listarHistorialPorMascota(req.user.id, req.params.idMascota);
    res.json(rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function obtener(req, res) {
  try {
    const row = await service.obtenerHistorial(req.user.id, req.params.id);
    res.json(row);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

async function actualizar(req, res) {
  try {
    const result = await service.actualizarHistorial(req.user.id, req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function existePorCita(req, res) {
  try {
    const ok = await service.existeHistorialPorCita(req.params.idCita);
    res.json({ exists: ok });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
module.exports = { crear, listarPorMascota, obtener, actualizar, existePorCita };

