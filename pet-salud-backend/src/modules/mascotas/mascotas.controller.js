const service = require('./mascotas.service');

async function create(req, res) {
  try {
    const result = await service.createMascota(req.user.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function listMine(req, res) {
  try {
    const rows = await service.listMascotasByOwner(req.user.id);
    res.json(rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getOne(req, res) {
  try {
    const row = await service.getMascotaById(req.user.id, req.params.id);
    res.json(row);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const result = await service.updateMascota(req.user.id, req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const result = await service.deleteMascota(req.user.id, req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { create, listMine, getOne, update, remove };
