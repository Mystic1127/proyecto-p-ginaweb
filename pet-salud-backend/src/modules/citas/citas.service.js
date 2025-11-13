const { getPool } = require('../../config/db');

async function getDuenoIdByUserId(idUsuario) {
  const pool = await getPool();
  const [r] = await pool.query('SELECT id_dueno FROM duenos WHERE id_usuario=?', [idUsuario]);
  if (!r.length) throw new Error('Perfil de dueño no encontrado');
  return r[0].id_dueno;
}

async function getVeterinarioIdByUserId(idUsuario) {
  const pool = await getPool();
  const [r] = await pool.query('SELECT id_veterinario FROM veterinarios WHERE id_usuario=?', [idUsuario]);
  if (!r.length) throw new Error('Perfil de veterinario no encontrado');
  return r[0].id_veterinario;
}

async function assertMascotaIsMine(idUsuario, idMascota) {
  const idDueno = await getDuenoIdByUserId(idUsuario);
  const pool = await getPool();
  const [rows] = await pool.query(
    'SELECT 1 FROM mascotas WHERE id_mascota=? AND id_dueno=?',
    [idMascota, idDueno]
  );
  if (!rows.length) throw new Error('La mascota no pertenece al usuario');
}

/* =========================
   CRUD / lógica de negocio
   ========================= */

async function crearCita({ rol, idUsuario, body }) {
  const { id_mascota, id_veterinario, fecha_hora, motivo } = body;
  const pool = await getPool();

  if (rol === 'DUENO') await assertMascotaIsMine(idUsuario, id_mascota);

  let idVet = id_veterinario;
  if (!idVet && rol === 'VETERINARIO') {
    idVet = await getVeterinarioIdByUserId(idUsuario);
  }
  if (!idVet) throw new Error('id_veterinario requerido');

  const [m] = await pool.query('SELECT id_dueno FROM mascotas WHERE id_mascota=?', [id_mascota]);
  if (!m.length) throw new Error('Mascota no encontrada');
  const id_dueno = m[0].id_dueno;

  const [dup] = await pool.query(
    `SELECT 1 FROM citas 
     WHERE id_mascota=? AND fecha_hora=? AND estado <> 'CANCELADA'`,
    [id_mascota, fecha_hora]
  );
  if (dup.length) throw new Error('Ya existe una cita para esa mascota en esa fecha/hora');

  const [ins] = await pool.query(
    `INSERT INTO citas (id_dueno, id_mascota, id_veterinario, fecha_hora, motivo, estado)
     VALUES (?, ?, ?, ?, ?, 'PROGRAMADA')`,
    [id_dueno, id_mascota, idVet, fecha_hora, motivo || null]
  );

  return { id_cita: ins.insertId };
}

async function listarCitas(rol, idUsuario) {
  const pool = await getPool();

  if (rol === 'DUENO') {
    const idDueno = await getDuenoIdByUserId(idUsuario);
    const [rows] = await pool.query(
      `SELECT c.*, m.nombre AS mascota_nombre, u.nombre_usuario AS veterinario_usuario
       FROM citas c
       JOIN mascotas m     ON m.id_mascota = c.id_mascota
       JOIN veterinarios v ON v.id_veterinario = c.id_veterinario
       JOIN usuarios u     ON u.id_usuario = v.id_usuario
       WHERE c.id_dueno = ?
       ORDER BY c.fecha_hora DESC`,
      [idDueno]
    );
    return rows;
  }

  if (rol === 'VETERINARIO') {
    const idVet = await getVeterinarioIdByUserId(idUsuario);
    const [rows] = await pool.query(
      `SELECT 
        c.*,
        m.nombre  AS mascota_nombre,
        m.especie AS mascota_especie,
        m.raza    AS mascota_raza,
        m.edad    AS mascota_edad,
        m.sexo    AS mascota_sexo,
        m.alergias AS mascota_alergias,
        m.vacunas  AS mascota_vacunas,
        d.nombres AS dueno_nombres, 
        d.apellidos AS dueno_apellidos
      FROM citas c
      JOIN mascotas m ON m.id_mascota = c.id_mascota
      JOIN duenos   d ON d.id_dueno   = c.id_dueno
      WHERE c.id_veterinario = ?
      ORDER BY c.fecha_hora DESC`,
      [idVet]
    );
    return rows;
  }

  const [rows] = await pool.query(
    `SELECT c.*, m.nombre AS mascota_nombre,
            d.nombres AS dueno_nombres, d.apellidos AS dueno_apellidos,
            u.nombre_usuario AS veterinario_usuario
     FROM citas c
     JOIN mascotas m     ON m.id_mascota = c.id_mascota
     JOIN duenos d       ON d.id_dueno   = c.id_dueno
     JOIN veterinarios v ON v.id_veterinario = c.id_veterinario
     JOIN usuarios u     ON u.id_usuario = v.id_usuario
     ORDER BY c.fecha_hora DESC`
  );
  return rows;
}

async function detalleCita(rol, idUsuario, id_cita) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT c.*,
            m.nombre AS mascota_nombre,
            d.id_dueno,
            v.id_veterinario,
            v.id_usuario AS id_usuario_vet,
            u.nombre_usuario AS veterinario_usuario
     FROM citas c
     JOIN mascotas m     ON m.id_mascota = c.id_mascota
     JOIN duenos d       ON d.id_dueno   = c.id_dueno
     JOIN veterinarios v ON v.id_veterinario = c.id_veterinario
     JOIN usuarios u     ON u.id_usuario = v.id_usuario
     WHERE c.id_cita = ?`,
    [id_cita]
  );
  if (!rows.length) throw new Error('Cita no encontrada');
  const c = rows[0];

  if (rol === 'DUENO') {
    const idDueno = await getDuenoIdByUserId(idUsuario);
    if (c.id_dueno !== idDueno) throw new Error('No autorizado');
  } else if (rol === 'VETERINARIO') {
    const idVet = await getVeterinarioIdByUserId(idUsuario);
    if (c.id_veterinario !== idVet) throw new Error('No autorizado');
  }

  return c;
}

async function actualizarCita(rol, idUsuario, id_cita, body) {
  const c = await detalleCita(rol, idUsuario, id_cita);
  const { fecha_hora, motivo, id_veterinario, estado } = body || {};
  const pool = await getPool();

  if (['ATENDIDA', 'CANCELADA'].includes(c.estado) && rol !== 'ADMIN') {
    throw new Error('No se puede modificar una cita atendida o cancelada');
  }

  if (!['ADMIN', 'RECEPCIONISTA'].includes(rol)) {
    if (rol === 'DUENO') {
      const idDueno = await getDuenoIdByUserId(idUsuario);
      if (c.id_dueno !== idDueno) throw new Error('No autorizado');
    }
    if (rol === 'VETERINARIO') {
      const myVetId = await getVeterinarioIdByUserId(idUsuario);
      if (c.id_veterinario !== myVetId) throw new Error('No autorizado');
    }
  }

  if (fecha_hora) {
    const [dup] = await pool.query(
      `SELECT 1 FROM citas 
       WHERE id_mascota=? AND fecha_hora=? 
         AND estado <> 'CANCELADA' AND id_cita <> ?`,
      [c.id_mascota, fecha_hora, id_cita]
    );
    if (dup.length) throw new Error('Ya existe una cita para esa mascota en esa fecha/hora');
  }

  let query = `
    UPDATE citas SET
      fecha_hora     = COALESCE(?, fecha_hora),
      motivo         = COALESCE(?, motivo),
      id_veterinario = COALESCE(?, id_veterinario)
  `;
  const params = [fecha_hora || null, motivo || null, id_veterinario || null];

  if (rol === 'ADMIN' && estado) {
    query += `, estado = ?`;
    params.push(estado);
  }

  query += ` WHERE id_cita = ?`;
  params.push(id_cita);

  await pool.query(query, params);

  const [updated] = await pool.query('SELECT * FROM citas WHERE id_cita=?', [id_cita]);
  return updated[0];
}


async function cambiarEstado(id_cita, estado, nota_cancel = null) {
  const pool = await getPool();

  let setExtra = '';
  if (estado === 'CONFIRMADA') setExtra = `, fecha_confirmada = COALESCE(fecha_confirmada, NOW())`;
  if (estado === 'ATENDIDA')   setExtra = `, fecha_atendida   = COALESCE(fecha_atendida,   NOW())`;
  if (estado === 'CANCELADA')  setExtra = `, fecha_cancelada  = COALESCE(fecha_cancelada,  NOW())`;

  await pool.query(
    `
    UPDATE citas
    SET estado = ?,
        nota_cancel = CASE WHEN ? IS NOT NULL AND ? <> '' THEN ? ELSE nota_cancel END
        ${setExtra}
    WHERE id_cita = ?
    `,
    [estado, nota_cancel, nota_cancel, nota_cancel, id_cita]
  );
  return { ok: true };
}

async function confirmarCita(rol, idUsuario, id_cita) {
  await detalleCita(rol, idUsuario, id_cita);
  return cambiarEstado(id_cita, 'CONFIRMADA');
}

async function cancelarCita(rol, idUsuario, id_cita, nota) {
  await detalleCita(rol, idUsuario, id_cita);
  return cambiarEstado(id_cita, 'CANCELADA', nota || null);
}

async function atenderCita(rol, idUsuario, id_cita) {
  const c = await detalleCita(rol, idUsuario, id_cita);
  if (rol === 'VETERINARIO') {
    const myVetId = await getVeterinarioIdByUserId(idUsuario);
    if (c.id_veterinario !== myVetId) throw new Error('No autorizado');
  }
  await cambiarEstado(id_cita, 'ATENDIDA');
  return { ok: true, factura_pendiente: true, id_cita };
}

module.exports = {
  crearCita,
  listarCitas,
  detalleCita,
  actualizarCita,
  confirmarCita,
  cancelarCita,
  atenderCita,
};
