const { getPool } = require('../../config/db');

async function getDuenoIdByMascota(id_mascota) {
  const pool = await getPool();
  const [r] = await pool.query('SELECT id_dueno FROM mascotas WHERE id_mascota=?', [id_mascota]);
  if (!r.length) throw new Error('Mascota no encontrada');
  return r[0].id_dueno;
}

function toNumberEnv(name, def) {
  const v = Number(process.env[name]);
  return Number.isFinite(v) ? v : def;
}

async function crearFactura({ id_dueno, id_mascota = null, id_cita = null, id_orden = null, items = [], observaciones = null }) {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [ins] = await conn.query(
      `INSERT INTO facturas (id_dueno, id_mascota, id_cita, id_orden, observaciones, estado)
       VALUES (?, ?, ?, ?, ?, 'PENDIENTE')`,
      [id_dueno, id_mascota, id_cita, id_orden, observaciones]
    );
    const id_factura = ins.insertId;

    let total = 0;
    for (const it of items) {
      const cantidad = Number(it.cantidad || 1);
      const precio   = Number(it.precio_unitario || 0);
      const subtotal = cantidad * precio;
      total += subtotal;

      await conn.query(
        `INSERT INTO detalle_factura (id_factura, descripcion_servicio, cantidad, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [id_factura, it.descripcion_servicio, cantidad, precio, subtotal]
      );
    }

    await conn.query(`UPDATE facturas SET monto_total=? WHERE id_factura=?`, [total, id_factura]);
    await conn.commit();
    return { id_factura, monto_total: total, estado: 'PENDIENTE' };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function crearFacturaPorCita({ id_cita }) {
  const pool = await getPool();
  const [cRows] = await pool.query(
    `SELECT c.id_cita, c.id_mascota, c.estado, d.id_dueno
     FROM citas c
     JOIN duenos d ON d.id_dueno = c.id_dueno
     WHERE c.id_cita=?`,
    [id_cita]
  );
  if (!cRows.length) throw new Error('Cita no encontrada');
  const cita = cRows[0];
  if (cita.estado !== 'ATENDIDA') throw new Error('La cita no está marcada como ATENDIDA');

  const precioConsulta = toNumberEnv('FACT_PRECIO_CONSULTA', 40);

  return crearFactura({
    id_dueno: cita.id_dueno,
    id_mascota: cita.id_mascota,
    id_cita: cita.id_cita,
    items: [
      { descripcion_servicio: 'Consulta veterinaria', cantidad: 1, precio_unitario: precioConsulta }
    ],
    observaciones: 'Factura generada automáticamente al atender cita'
  });
}

/* =========================
   Automática por ORDEN validada
   ========================= */
async function crearFacturaPorOrdenValidada({ id_orden }) {
  const pool = await getPool();

  // Orden + Resultado validado (último) + tipo_examen
  const [oRows] = await pool.query(
    `SELECT o.id_orden, o.id_mascota, o.tipo_examen, r.validado
     FROM ordenes o
     JOIN resultados r ON r.id_orden = o.id_orden
     WHERE o.id_orden = ?
     ORDER BY r.id_resultado DESC
     LIMIT 1`,
    [id_orden]
  );
  if (!oRows.length) throw new Error('Orden/resultado no encontrado');
  const info = oRows[0];
  if (!info.validado) throw new Error('El resultado aún no está validado');

  const id_dueno = await getDuenoIdByMascota(info.id_mascota);

  // Precio por examen (simple por env)
  const baseRapido = toNumberEnv('FACT_PRECIO_ANALISIS_RAPIDO', 35);
  const baseOtro   = toNumberEnv('FACT_PRECIO_ANALISIS_OTRO', 50);
  const precio = /RAPID|RÁPID/i.test(info.tipo_examen || '') ? baseRapido : baseOtro;

  console.log('🧾 Creando factura por orden validada:', { id_orden, id_dueno, precio, tipo: info.tipo_examen });

  return crearFactura({
    id_dueno,
    id_mascota: info.id_mascota,
    id_orden: info.id_orden,
    items: [
      { descripcion_servicio: `Análisis: ${info.tipo_examen}`, cantidad: 1, precio_unitario: precio }
    ],
    observaciones: 'Factura generada automáticamente al validar resultado'
  });
}

/* =========================
   Listar / Detalle / Pagar / Anular
   ========================= */
async function listarFacturas({ rol, idUsuario }) {
  const pool = await getPool();
  if (rol === 'DUENO') {
    const [d] = await pool.query('SELECT id_dueno FROM duenos WHERE id_usuario=?', [idUsuario]);
    if (!d.length) throw new Error('Perfil de dueño no encontrado');
    const id_dueno = d[0].id_dueno;
    const [rows] = await pool.query(
      `SELECT * FROM facturas WHERE id_dueno=? ORDER BY fecha_emision DESC`,
      [id_dueno]
    );
    return rows;
  }
  const [rows] = await pool.query(`SELECT * FROM facturas ORDER BY fecha_emision DESC`);
  return rows;
}

async function detalleFactura({ rol, idUsuario, id_factura }) {
  const pool = await getPool();
  const [f] = await pool.query(`SELECT * FROM facturas WHERE id_factura=?`, [id_factura]);
  if (!f.length) throw new Error('Factura no encontrada');
  const fac = f[0];

  if (rol === 'DUENO') {
    const [d] = await pool.query('SELECT id_dueno FROM duenos WHERE id_usuario=?', [idUsuario]);
    if (!d.length || d[0].id_dueno !== fac.id_dueno) throw new Error('No autorizado');
  }

  const [det] = await pool.query(`SELECT * FROM detalle_factura WHERE id_factura=?`, [id_factura]);
  return { ...fac, items: det };
}

async function pagarFactura({ id_factura, metodo_pago }) {
  const pool = await getPool();
  await pool.query(
    `UPDATE facturas SET estado='PAGADA', metodo_pago=? WHERE id_factura=? AND estado='PENDIENTE'`,
    [metodo_pago || 'EFECTIVO', id_factura]
  );
  return { ok: true };
}

async function anularFactura({ id_factura, observaciones }) {
  const pool = await getPool();
  await pool.query(
    `UPDATE facturas SET estado='ANULADA', observaciones=COALESCE(?, observaciones) WHERE id_factura=? AND estado<>'ANULADA'`,
    [observaciones || 'Anulada por administración', id_factura]
  );
  return { ok: true };
}

module.exports = {
  crearFactura,
  crearFacturaPorCita,
  crearFacturaPorOrdenValidada,
  listarFacturas,
  detalleFactura,
  pagarFactura,
  anularFactura,
};
