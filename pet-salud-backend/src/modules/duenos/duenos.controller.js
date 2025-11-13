const svc = require('./duenos.service');

/* DUENO: ver mi perfil */
async function me(req, res) {
  try {
    const out = await svc.getMyProfile(req.user.id);
    res.json(out);
  } catch (e) { res.status(404).json({ error: e.message }); }
}

/* DUENO: actualizar mi perfil */
async function updateMe(req, res) {
  try {
    const out = await svc.updateMyProfile(req.user.id, req.body || {});
    res.json(out);
  } catch (e) { res.status(400).json({ error: e.message }); }
}

/* ===== Admin/Recepción ===== */
async function list(_req, res) {
  try { res.json(await svc.listAll()); }
  catch (e) { res.status(400).json({ error: e.message }); }
}

async function getOne(req, res) {
  try { res.json(await svc.getById(Number(req.params.id))); }
  catch (e) { res.status(404).json({ error: e.message }); }
}

async function createForUser(req, res) {
  try {
    const out = await svc.createForExistingUser(req.body || {});
    res.status(201).json(out);
  } catch (e) { res.status(400).json({ error: e.message }); }
}

async function updateById(req, res) {
  try {
    const out = await svc.updateById(Number(req.params.id), req.body || {});
    res.json(out);
  } catch (e) { res.status(400).json({ error: e.message }); }
}

module.exports = {
  me, updateMe,
  list, getOne, createForUser, updateById
};
