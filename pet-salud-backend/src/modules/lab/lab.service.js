const { getPool } = require('../../config/db');

async function getDuenoIdByUserId(idUsuario) {
  const pool = await getPool();
  const [rows] = await pool.query(
    'SELECT id_dueno FROM duenos WHERE id_usuario = ?',
    [idUsuario]
  );
  if (!rows.length) throw new Error('Perfil de dueño no encontrado');
  return rows[0].id_dueno;
}

async function assertMascotaIsMine(idUsuario, idMascota) {
  const idDueno = await getDuenoIdByUserId(idUsuario);
  const pool = await getPool();
  const [rows] = await pool.query(
    'SELECT 1 FROM mascotas WHERE id_mascota = ? AND id_dueno = ?',
    [idMascota, idDueno]
  );
  if (!rows.length) throw new Error('La mascota no pertenece al usuario');
}

/** Crear orden **/
async function crearOrden({ idUsuario, body, idVetOpt }) {
  const { id_mascota, tipo_examen, observaciones } = body;
  if (!idVetOpt) await assertMascotaIsMine(idUsuario, id_mascota);

  const pool = await getPool();
  const [res] = await pool.query(
    `INSERT INTO ordenes (id_mascota, id_veterinario, tipo_examen, observaciones, estado)
     VALUES (?, ?, ?, ?, 'EMITIDA')`,
    [id_mascota, idVetOpt || null, tipo_examen, observaciones || null]
  );
  return { id_orden: res.insertId };
}

/** Registrar toma de muestra **/
async function registrarToma({ id_orden, id_tecnico, tipo_muestra, fecha_hora, notas }) {
  const pool = await getPool();

  const [o] = await pool.query('SELECT estado FROM ordenes WHERE id_orden = ?', [id_orden]);
  if (!o.length) throw new Error('Orden no encontrada');
  if (['VALIDADA', 'ANULADA'].includes(o[0].estado)) throw new Error('Orden no permite más acciones');

  await pool.query(
    `INSERT INTO tomas_muestra (id_orden, id_tecnico, tipo_muestra, fecha_hora, notas)
     VALUES (?, ?, ?, ?, ?)`,
    [id_orden, id_tecnico || null, tipo_muestra, fecha_hora, notas || null]
  );

  await pool.query(`UPDATE ordenes SET estado = 'MUESTRA_TOMADA' WHERE id_orden = ?`, [id_orden]);
  return { ok: true };
}

/** Registrar resultado **/
async function registrarResultado({ id_orden, descripcion, valores, conclusiones }) {
  const pool = await getPool();
  const [o] = await pool.query('SELECT estado FROM ordenes WHERE id_orden = ?', [id_orden]);
  if (!o.length) throw new Error('Orden no encontrada');

  await pool.query(
    `INSERT INTO resultados (id_orden, descripcion, valores, conclusiones)
     VALUES (?, ?, ?, ?)`,
    [id_orden, descripcion || null, JSON.stringify(valores || {}), conclusiones || null]
  );

  await pool.query(`UPDATE ordenes SET estado = 'RESULTADO_REGISTRADO' WHERE id_orden = ?`, [id_orden]);
  return { ok: true };
}

/** Validar resultado **/
async function validarResultado({ id_orden, id_veterinario }) {
  const pool = await getPool();
  const [r] = await pool.query(
    'SELECT id_resultado FROM resultados WHERE id_orden = ? ORDER BY id_resultado DESC LIMIT 1',
    [id_orden]
  );
  if (!r.length) throw new Error('No hay resultado registrado');

  await pool.query(
    `UPDATE resultados SET validado = 1, id_veterinario_validador = ? WHERE id_resultado = ?`,
    [id_veterinario, r[0].id_resultado]
  );
  await pool.query(`UPDATE ordenes SET estado = 'VALIDADA' WHERE id_orden = ?`, [id_orden]);
  return { ok: true };
}

/** Consultas **/
async function detalleOrden(_idUsuario, id_orden) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT o.*, m.nombre AS nombre_mascota, m.id_mascota
     FROM ordenes o
     JOIN mascotas m ON m.id_mascota = o.id_mascota
     WHERE o.id_orden = ?`,
    [id_orden]
  );
  if (!rows.length) throw new Error('Orden no encontrada');
  return rows[0];
}

async function listarOrdenesDueno(idUsuario) {
  const idDueno = await getDuenoIdByUserId(idUsuario);
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT o.*, m.nombre AS nombre_mascota
     FROM ordenes o
     JOIN mascotas m ON m.id_mascota = o.id_mascota
     WHERE m.id_dueno = ?
     ORDER BY o.creado_en DESC`,
    [idDueno]
  );
  return rows;
}

async function listarOrdenesAdmin() {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT o.*, m.nombre AS nombre_mascota, d.nombres AS dueno, d.apellidos AS dueno_ap
     FROM ordenes o
     JOIN mascotas m ON m.id_mascota = o.id_mascota
     JOIN duenos  d ON d.id_dueno = (SELECT id_dueno FROM mascotas WHERE id_mascota = o.id_mascota)
     ORDER BY o.creado_en DESC`
  );
  return rows;
}

/** Datos completos para informe PDF **/
async function getDataForReport(id_orden) {
  const pool = await getPool();

  const [ordenRows] = await pool.query(
    `SELECT 
       o.*,
       m.id_mascota, m.nombre AS mascota_nombre, m.especie, m.raza, m.edad, m.sexo,
       d.id_dueno, d.nombres AS dueno_nombres, d.apellidos AS dueno_apellidos, d.telefono,
       u.email AS dueno_email
     FROM ordenes o
     JOIN mascotas m ON m.id_mascota = o.id_mascota
     JOIN duenos  d ON d.id_dueno  = (SELECT id_dueno FROM mascotas WHERE id_mascota = o.id_mascota)
     JOIN usuarios u ON u.id_usuario = d.id_usuario
     WHERE o.id_orden = ?`,
    [id_orden]
  );
  if (!ordenRows.length) throw new Error('Orden no encontrada');
  const orden = ordenRows[0];

  const [resRows] = await pool.query(
    `SELECT * FROM resultados WHERE id_orden = ? ORDER BY id_resultado DESC LIMIT 1`,
    [id_orden]
  );
  const resultado = resRows.length ? resRows[0] : null;

  let vet_validador = null;
  if (resultado && resultado.id_veterinario_validador) {
    const [vetUser] = await pool.query(
      `SELECT u.id_usuario, u.nombre_usuario, v.id_veterinario, v.especialidad, v.telefono,
              (SELECT nombres FROM duenos WHERE id_usuario = u.id_usuario) AS nombres,
              (SELECT apellidos FROM duenos WHERE id_usuario = u.id_usuario) AS apellidos
       FROM usuarios u
       LEFT JOIN veterinarios v ON v.id_usuario = u.id_usuario
       WHERE u.id_usuario = ?`,
      [resultado.id_veterinario_validador]
    );
    vet_validador = vetUser.length ? vetUser[0] : null;
  }

  return {
    orden: {
      id_orden: orden.id_orden,
      tipo_examen: orden.tipo_examen,
      observaciones: orden.observaciones,
      estado: orden.estado,
      creado_en: orden.creado_en
    },
    mascota: {
      id_mascota: orden.id_mascota,
      nombre: orden.mascota_nombre,
      especie: orden.especie,
      raza: orden.raza,
      edad: orden.edad,
      sexo: orden.sexo
    },
    dueno: {
      id_dueno: orden.id_dueno,
      nombres: orden.dueno_nombres,
      apellidos: orden.dueno_apellidos,
      telefono: orden.telefono,
      email: orden.dueno_email
    },
    resultado,
    vet_validador
  };
}

async function getTecnicoIdByUserId(idUsuario) {
  const pool = await getPool();
  const [r] = await pool.query(`SELECT id_tecnico FROM tecnicos WHERE id_usuario = ?`, [idUsuario]);
  if (!r.length) throw new Error('Perfil de técnico no encontrado');
  return r[0].id_tecnico;
}

async function getVeterinarioIdByUserId(idUsuario) {
  const pool = await getPool();
  const [r] = await pool.query(`SELECT id_veterinario FROM veterinarios WHERE id_usuario = ?`, [idUsuario]);
  if (!r.length) throw new Error('Perfil de veterinario no encontrado');
  return r[0].id_veterinario;
}

// ---- Export único (incluye TODAS las funciones) ----
module.exports = {
  crearOrden,
  registrarToma,
  registrarResultado,
  validarResultado,
  detalleOrden,
  listarOrdenesDueno,
  listarOrdenesAdmin,
  assertMascotaIsMine,
  getDataForReport,
  getTecnicoIdByUserId,     // 👈 nuevo
  getVeterinarioIdByUserId, // 👈 nuevo
};
