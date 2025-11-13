const { getPool } = require('../../config/db');

function rangeDefaults(desde, meses) {
  const now = new Date();
  const m = Number(meses || 12);
  let start;
  if (desde && /^\d{4}-\d{2}$/.test(desde)) {
    start = new Date(`${desde}-01T00:00:00`);
  } else {
    start = new Date(now);
    start.setMonth(start.getMonth() - (m - 1));
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  const end = new Date(start);
  end.setMonth(end.getMonth() + m);
  return { start, end, meses: m };
}

async function ingresosMensuales({ desde, meses }) {
  const { start, end } = rangeDefaults(desde, meses);
  const pool = await getPool();
  const [rows] = await pool.query(
    `
    SELECT DATE_FORMAT(fecha_emision, '%Y-%m') AS ym,
           SUM(monto_total) AS total
    FROM facturas
    WHERE estado='PAGADA'
      AND fecha_emision >= ? AND fecha_emision < ?
    GROUP BY ym
    ORDER BY ym ASC
    `,
    [start, end]
  );
  return rows;
}

async function citasStats({ desde, meses }) {
  const { start, end } = rangeDefaults(desde, meses);
  const pool = await getPool();

  const [est] = await pool.query(
    `
    SELECT estado, COUNT(*) AS n
    FROM citas
    WHERE fecha_hora >= ? AND fecha_hora < ?
    GROUP BY estado
    `,
    [start, end]
  );

  const count = (name) =>
    est.find((r) => r.estado === name)?.n || 0;

  const total = est.reduce((a, r) => a + Number(r.n), 0);
  const atendidas = count('ATENDIDA');
  const canceladas = count('CANCELADA');

  const [avgRows] = await pool.query(
    `
    SELECT AVG(TIMESTAMPDIFF(MINUTE, fecha_hora, fecha_atendida)) AS avg_min
    FROM citas
    WHERE fecha_atendida IS NOT NULL
      AND fecha_hora >= ? AND fecha_hora < ?
    `,
    [start, end]
  );
  const promedio_min = Number(avgRows[0]?.avg_min ?? 0);

  return {
    total,
    atendidas,
    canceladas,
    pct_atendidas: total ? Number((100 * atendidas) / total).toFixed(2) : '0.00',
    pct_canceladas: total ? Number((100 * canceladas) / total).toFixed(2) : '0.00',
    promedio_minutos_atencion: Math.round(promedio_min)
  };
}

async function topServicios({ desde, meses, limit }) {
  const { start, end } = rangeDefaults(desde, meses);
  const lim = Number(limit || 5);
  const pool = await getPool();
  const [rows] = await pool.query(
    `
    SELECT COALESCE(NULLIF(TRIM(motivo),''), 'SIN MOTIVO') AS servicio,
           COUNT(*) AS veces
    FROM citas
    WHERE fecha_hora >= ? AND fecha_hora < ?
    GROUP BY servicio
    ORDER BY veces DESC
    LIMIT ?
    `,
    [start, end, lim]
  );
  return rows;
}

async function ventasPorExamen({ desde, meses }) {
  const { start, end } = rangeDefaults(desde, meses);
  const pool = await getPool();
  const [rows] = await pool.query(
    `
    SELECT
      TRIM(SUBSTRING_INDEX(descripcion_servicio, ':', -1)) AS tipo_examen,
      SUM(subtotal) AS total
    FROM detalle_factura df
    JOIN facturas f ON f.id_factura = df.id_factura
    WHERE f.estado IN ('PAGADA','PENDIENTE')             -- puedes restringir a PAGADA si prefieres
      AND f.fecha_emision >= ? AND f.fecha_emision < ?
      AND df.descripcion_servicio LIKE 'Análisis:%'
    GROUP BY tipo_examen
    ORDER BY total DESC
    `,
    [start, end]
  );
  return rows;
}

module.exports = {
  ingresosMensuales,
  citasStats,
  topServicios,
  ventasPorExamen,
};
