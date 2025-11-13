const { getPool } = require('../../config/db');

async function getVeterinarioIdByUserId(idUsuario) {
  const pool = await getPool();
  const [r] = await pool.query('SELECT id_veterinario FROM veterinarios WHERE id_usuario=?', [idUsuario]);
  if (!r.length) throw new Error('Perfil de veterinario no encontrado');
  return r[0].id_veterinario;
}

async function crearHistorial(idUsuario, data) {
  const pool = await getPool();
  const idVeterinario = await getVeterinarioIdByUserId(idUsuario);
  
  const {
    id_cita,
    id_mascota,
    diagnostico,
    tratamiento,
    observaciones,
    receta_medica,
    examenes_solicitados,
    proxima_cita,
    peso,
    temperatura
  } = data;

  const [cita] = await pool.query(
    'SELECT * FROM citas WHERE id_cita = ? AND id_veterinario = ?',
    [id_cita, idVeterinario]
  );
  
  if (!cita.length) throw new Error('Cita no encontrada o no autorizada');
  if (cita[0].estado !== 'ATENDIDA') throw new Error('La cita debe estar atendida');

  const [result] = await pool.query(
    `INSERT INTO historial_clinico 
     (id_cita, id_mascota, id_veterinario, diagnostico, tratamiento, observaciones, 
      receta_medica, examenes_solicitados, proxima_cita, peso, temperatura)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id_cita,
      id_mascota,
      idVeterinario,
      diagnostico,
      tratamiento || null,
      observaciones || null,
      receta_medica || null,
      examenes_solicitados || null,
      proxima_cita || null,
      peso || null,
      temperatura || null
    ]
  );

  return { id_historial: result.insertId };
}

async function listarHistorialPorMascota(idUsuario, idMascota) {
  const pool = await getPool();
  const idVeterinario = await getVeterinarioIdByUserId(idUsuario);

  const [rows] = await pool.query(
    `SELECT h.*,
            c.fecha_hora            AS fecha_cita,
            m.nombre                AS mascota_nombre,
            m.especie, m.raza, m.edad, m.sexo,
            d.nombres               AS dueno_nombres,
            d.apellidos             AS dueno_apellidos,
            u.nombre_usuario        AS veterinario
     FROM historial_clinico h
     JOIN citas        c ON c.id_cita      = h.id_cita
     JOIN mascotas     m ON m.id_mascota   = h.id_mascota
     JOIN duenos       d ON d.id_dueno     = m.id_dueno
     JOIN veterinarios v ON v.id_veterinario = h.id_veterinario
     JOIN usuarios     u ON u.id_usuario   = v.id_usuario
     WHERE h.id_mascota = ?
     ORDER BY h.creado_en DESC`,
    [idMascota]
  );
  return rows;
}

async function obtenerHistorial(idUsuario, idHistorial) {
  const pool = await getPool();
  
  const [rows] = await pool.query(
    `SELECT h.*, 
            c.fecha_hora as fecha_cita,
            m.nombre as mascota_nombre,
            m.especie, m.raza, m.edad, m.sexo,
            d.nombres as dueno_nombres, d.apellidos as dueno_apellidos,
            u.nombre_usuario as veterinario
     FROM historial_clinico h
     JOIN citas c ON c.id_cita = h.id_cita
     JOIN mascotas m ON m.id_mascota = h.id_mascota
     JOIN duenos d ON d.id_dueno = m.id_dueno
     JOIN veterinarios v ON v.id_veterinario = h.id_veterinario
     JOIN usuarios u ON u.id_usuario = v.id_usuario
     WHERE h.id_historial = ?`,
    [idHistorial]
  );

  if (!rows.length) throw new Error('Historial no encontrado');
  return rows[0];
}

async function actualizarHistorial(idUsuario, idHistorial, data) {
  const pool = await getPool();
  const idVeterinario = await getVeterinarioIdByUserId(idUsuario);

  const [historial] = await pool.query(
    'SELECT * FROM historial_clinico WHERE id_historial = ? AND id_veterinario = ?',
    [idHistorial, idVeterinario]
  );

  if (!historial.length) throw new Error('Historial no encontrado o no autorizado');

  const {
    diagnostico,
    tratamiento,
    observaciones,
    receta_medica,
    examenes_solicitados,
    proxima_cita,
    peso,
    temperatura
  } = data;

  await pool.query(
    `UPDATE historial_clinico SET
      diagnostico = COALESCE(?, diagnostico),
      tratamiento = COALESCE(?, tratamiento),
      observaciones = COALESCE(?, observaciones),
      receta_medica = COALESCE(?, receta_medica),
      examenes_solicitados = COALESCE(?, examenes_solicitados),
      proxima_cita = COALESCE(?, proxima_cita),
      peso = COALESCE(?, peso),
      temperatura = COALESCE(?, temperatura)
     WHERE id_historial = ?`,
    [
      diagnostico || null,
      tratamiento || null,
      observaciones || null,
      receta_medica || null,
      examenes_solicitados || null,
      proxima_cita || null,
      peso || null,
      temperatura || null,
      idHistorial
    ]
  );

  return { ok: true };
}

async function existeHistorialPorCita(idCita) {
  const pool = await getPool();
  const [r] = await pool.query('SELECT 1 FROM historial_clinico WHERE id_cita=? LIMIT 1', [idCita]);
  return r.length > 0;
}
module.exports = {
  crearHistorial, listarHistorialPorMascota, obtenerHistorial, actualizarHistorial, existeHistorialPorCita
};