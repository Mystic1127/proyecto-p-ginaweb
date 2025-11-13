const { getPool } = require('../../config/db');

async function me(req, res) {
  const pool = await getPool();
  if (req.user.rol === 'VETERINARIO') {
    const [r] = await pool.query(
      `SELECT u.id_usuario, u.nombre_usuario, u.email,
              v.id_veterinario, v.especialidad, v.telefono
       FROM usuarios u JOIN veterinarios v ON v.id_usuario = u.id_usuario
       WHERE u.id_usuario = ?`, [req.user.id]);
    return res.json(r[0] || {});
  }
  if (req.user.rol === 'TECNICO') {
    const [r] = await pool.query(
      `SELECT u.id_usuario, u.nombre_usuario, u.email,
              t.id_tecnico, t.especialidad, t.telefono
       FROM usuarios u JOIN tecnicos t ON t.id_usuario = u.id_usuario
       WHERE u.id_usuario = ?`, [req.user.id]);
    return res.json(r[0] || {});
  }
  return res.status(403).json({ error: 'Solo personal técnico o veterinario' });
}

async function updateMe(req, res) {
  const pool = await getPool();
  const { especialidad, telefono } = req.body || {};
  if (req.user.rol === 'VETERINARIO') {
    await pool.query(`UPDATE veterinarios SET especialidad=?, telefono=? WHERE id_usuario=?`,
      [especialidad || null, telefono || null, req.user.id]);
    return res.json({ ok: true });
  }
  if (req.user.rol === 'TECNICO') {
    await pool.query(`UPDATE tecnicos SET especialidad=?, telefono=? WHERE id_usuario=?`,
      [especialidad || null, telefono || null, req.user.id]);
    return res.json({ ok: true });
  }
  return res.status(403).json({ error: 'Solo personal técnico o veterinario' });
}

async function listVeterinarios(_req, res) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT u.id_usuario, u.nombre_usuario, u.email,
            v.id_veterinario, v.especialidad, v.telefono
     FROM veterinarios v JOIN usuarios u ON u.id_usuario = v.id_usuario
     ORDER BY u.nombre_usuario`);
  res.json(rows);
}

async function listTecnicos(_req, res) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT u.id_usuario, u.nombre_usuario, u.email,
            t.id_tecnico, t.especialidad, t.telefono
     FROM tecnicos t JOIN usuarios u ON u.id_usuario = t.id_usuario
     ORDER BY u.nombre_usuario`);
  res.json(rows);
}

async function listRecepcionistas(_req, res) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT id_usuario, nombre_usuario, email, rol
     FROM usuarios
     WHERE rol='RECEPCIONISTA'
     ORDER BY nombre_usuario`);
  res.json(rows);
}

async function listAdmins(_req, res) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT id_usuario, nombre_usuario, email, rol
     FROM usuarios
     WHERE rol='ADMIN'
     ORDER BY nombre_usuario`);
  res.json(rows);
}

async function listVeterinariosPublic(_req, res) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT v.id_veterinario, u.nombre_usuario, u.email, v.especialidad, v.telefono
     FROM veterinarios v
     JOIN usuarios u ON u.id_usuario = v.id_usuario
     ORDER BY u.nombre_usuario`
  );
  res.json(rows);
}


module.exports = {
  me,
  updateMe,
  listVeterinarios,
  listTecnicos,
  listRecepcionistas,
  listAdmins,
  listVeterinariosPublic,
};
