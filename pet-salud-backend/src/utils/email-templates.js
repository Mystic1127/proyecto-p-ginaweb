function resultReadyTemplate({ duenoNombre, mascotaNombre, idOrden }) {
  const base = process.env.APP_BASE_URL || 'http://localhost:5000';
  const informeUrl = `${base}/lab/informe/${idOrden}`;
  return {
    subject: `Resultados disponibles – Orden #${idOrden}`,
    html: `
      <p>Hola ${duenoNombre},</p>
      <p>Los resultados del análisis de <b>${mascotaNombre}</b> ya están disponibles.</p>
      <p>Puedes ver y descargar el informe aquí: <a href="${informeUrl}">${informeUrl}</a></p>
      <p>– PetSalud</p>
    `
  };
}

function resultValidatedTemplate({ duenoNombre, mascotaNombre, idOrden }) {
  const base = process.env.APP_BASE_URL || 'http://localhost:5000';
  const informeUrl = `${base}/lab/informe/${idOrden}`;
  return {
    subject: `Informe validado – Orden #${idOrden}`,
    html: `
      <p>Hola ${duenoNombre},</p>
      <p>El veterinario ha <b>validado</b> el informe de <b>${mascotaNombre}</b>.</p>
      <p>Descarga el PDF con QR de autenticidad: <a href="${informeUrl}">${informeUrl}</a></p>
      <p>Sigue las indicaciones médicas adjuntas.</p>
      <p>– PetSalud</p>
    `
  };
}

module.exports = { resultReadyTemplate, resultValidatedTemplate };
