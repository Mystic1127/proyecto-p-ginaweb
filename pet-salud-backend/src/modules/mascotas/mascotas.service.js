const { getPool } = require('../../config/db');

async function getDuenoIdByUserId(idUsuario) {
  const pool = await getPool();
  const [rows] = await pool.query(
    'SELECT id_dueno FROM duenos WHERE id_usuario = ?',
    [idUsuario]
  );
  if (rows.length === 0) throw new Error('Perfil de dueño no encontrado');
  return rows[0].id_dueno;
}

async function createMascota(idUsuario, data) {
  const idDueno = await getDuenoIdByUserId(idUsuario);
  const { nombre, especie, raza, edad, sexo, alergias, vacunas } = data;

  const pool = await getPool();
  const [result] = await pool.query(
    `INSERT INTO mascotas
     (id_dueno, nombre, especie, raza, edad, sexo, alergias, vacunas)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [idDueno, nombre, especie, raza || null, edad || null, sexo || 'INDETERMINADO', alergias || null, vacunas || null]
  );
  return { id_mascota: result.insertId };
}

async function listMascotasByOwner(idUsuario) {
  const idDueno = await getDuenoIdByUserId(idUsuario);
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT id_mascota, nombre, especie, raza, edad, sexo, alergias, vacunas, creado_en, actualizado_en
     FROM mascotas
     WHERE id_dueno = ?
     ORDER BY creado_en DESC`,
    [idDueno]
  );
  return rows;
}

async function getMascotaById(idUsuario, idMascota) {
  const idDueno = await getDuenoIdByUserId(idUsuario);
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT id_mascota, nombre, especie, raza, edad, sexo, alergias, vacunas, creado_en, actualizado_en
     FROM mascotas
     WHERE id_mascota = ? AND id_dueno = ?`,
    [idMascota, idDueno]
  );
  if (rows.length === 0) throw new Error('Mascota no encontrada');
  return rows[0];
}

async function updateMascota(idUsuario, idMascota, data) {
  const idDueno = await getDuenoIdByUserId(idUsuario);
  const { nombre, especie, raza, edad, sexo, alergias, vacunas } = data;

  const pool = await getPool();
  const [result] = await pool.query(
    `UPDATE mascotas
     SET nombre = ?, especie = ?, raza = ?, edad = ?, sexo = ?, alergias = ?, vacunas = ?
     WHERE id_mascota = ? AND id_dueno = ?`,
    [nombre, especie, raza || null, edad || null, sexo || 'INDETERMINADO', alergias || null, vacunas || null, idMascota, idDueno]
  );
  if (result.affectedRows === 0) throw new Error('No se pudo actualizar (verifique ID)');
  return { updated: true };
}

async function deleteMascota(idUsuario, idMascota) {
  const idDueno = await getDuenoIdByUserId(idUsuario);
  const pool = await getPool();
  const [result] = await pool.query(
    `DELETE FROM mascotas WHERE id_mascota = ? AND id_dueno = ?`,
    [idMascota, idDueno]
  );
  if (result.affectedRows === 0) throw new Error('No se pudo eliminar (verifique ID)');
  return { deleted: true };
}

module.exports = {
  createMascota,
  listMascotasByOwner,
  getMascotaById,
  updateMascota,
  deleteMascota,
};
