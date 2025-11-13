const svc = require('./reportes.service');

async function getIngresos(req, res) {
  try {
    const data = await svc.ingresosMensuales({
      desde: req.query.desde,
      meses: req.query.meses
    });
    res.json(data);
  } catch (e) { res.status(400).json({ error: e.message }); }
}

async function getCitasStats(req, res) {
  try {
    const data = await svc.citasStats({
      desde: req.query.desde,
      meses: req.query.meses
    });
    res.json(data);
  } catch (e) { res.status(400).json({ error: e.message }); }
}

async function getTopServicios(req, res) {
  try {
    const data = await svc.topServicios({
      desde: req.query.desde,
      meses: req.query.meses,
      limit: req.query.limit
    });
    res.json(data);
  } catch (e) { res.status(400).json({ error: e.message }); }
}

async function getVentasExamen(req, res) {
  try {
    const data = await svc.ventasPorExamen({
      desde: req.query.desde,
      meses: req.query.meses
    });
    res.json(data);
  } catch (e) { res.status(400).json({ error: e.message }); }
}

module.exports = {
  getIngresos,
  getCitasStats,
  getTopServicios,
  getVentasExamen,
};
