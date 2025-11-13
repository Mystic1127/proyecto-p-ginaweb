const { getPool } = require('../../config/db');

/* Perfil del Dueño  */
async function getMyProfile(idUsuario) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT d.id_dueno, d.dni, d.nombres, d.apellidos, d.telefono,
            u.id_usuario, u.nombre_usuario, u.email, u.rol, u.activo, u.creado_en
     FROM duenos d
     JOIN usuarios u ON u.id_usuario = d.id_usuario
     WHERE d.id_usuario = ?`,
    [idUsuario]
  );
  if (!rows.length) throw new Error('Perfil de dueño no encontrado');
  return rows[0];
}

async function updateMyProfile(idUsuario, { dni, nombres, apellidos, telefono }) {
  const pool = await getPool();
  const [res] = await pool.query(
    `UPDATE duenos
       SET dni = COALESCE(?, dni),
           nombres = COALESCE(?, nombres),
           apellidos = COALESCE(?, apellidos),
           telefono = COALESCE(?, telefono)
     WHERE id_usuario = ?`,
    [dni ?? null, nombres ?? null, apellidos ?? null, telefono ?? null, idUsuario]
  );
  if (res.affectedRows === 0) throw new Error('No se pudo actualizar el perfil');
  return { updated: true };
}

/* ===== Admin/Recepción ===== */

async function listAll() {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT d.id_dueno, d.dni, d.nombres, d.apellidos, d.telefono,
            u.id_usuario, u.nombre_usuario, u.email, u.activo, u.creado_en
     FROM duenos d
     JOIN usuarios u ON u.id_usuario = d.id_usuario
     ORDER BY d.nombres, d.apellidos`
  );
  return rows;
}

async function getById(id_dueno) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT d.id_dueno, d.dni, d.nombres, d.apellidos, d.telefono,
            u.id_usuario, u.nombre_usuario, u.email, u.activo, u.creado_en
     FROM duenos d
     JOIN usuarios u ON u.id_usuario = d.id_usuario
     WHERE d.id_dueno = ?`,
    [id_dueno]
  );
  if (!rows.length) throw new Error('Dueño no encontrado');
  return rows[0];
}

async function createForExistingUser({ id_usuario, dni, nombres, apellidos, telefono }) {
  const pool = await getPool();
  const [u] = await pool.query(`SELECT id_usuario, rol FROM usuarios WHERE id_usuario=?`, [id_usuario]);
  if (!u.length) throw new Error('Usuario no encontrado');
  if (u[0].rol !== 'DUENO') throw new Error('El usuario no tiene rol DUENO');

  const [exists] = await pool.query(`SELECT 1 FROM duenos WHERE id_usuario=?`, [id_usuario]);
  if (exists.length) throw new Error('Ese usuario ya tiene perfil de dueño');

  const [ins] = await pool.query(
    `INSERT INTO duenos (id_usuario, dni, nombres, apellidos, telefono)
     VALUES (?, ?, ?, ?, ?)`,
    [id_usuario, dni ?? null, nombres ?? null, apellidos ?? null, telefono ?? null]
  );
  return { id_dueno: ins.insertId };
}

async function updateById(id_dueno, { dni, nombres, apellidos, telefono }) {
  const pool = await getPool();
  const [res] = await pool.query(
    `UPDATE duenos
       SET dni = COALESCE(?, dni),
           nombres = COALESCE(?, nombres),
           apellidos = COALESCE(?, apellidos),
           telefono = COALESCE(?, telefono)
     WHERE id_dueno = ?`,
    [dni ?? null, nombres ?? null, apellidos ?? null, telefono ?? null, id_dueno]
  );
  if (res.affectedRows === 0) throw new Error('No se pudo actualizar');
  return { updated: true };
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  listAll,
  getById,
  createForExistingUser,
  updateById,
};
