function resultReadyTemplate({ duenoNombre, mascotaNombre, idOrden }) {
  return {
    subject: `Resultados disponibles – Orden #${idOrden}`,
    html: `
      <p>Hola ${duenoNombre},</p>
      <p>Los resultados del análisis de <b>${mascotaNombre}</b> ya están disponibles.</p>
      <p>Adjuntamos el informe preliminar en PDF para tu revisión.</p>
      <p>– PetSalud</p>
    `
  };
}

function resultValidatedTemplate({ duenoNombre, mascotaNombre, idOrden }) {
  return {
    subject: `Informe validado – Orden #${idOrden}`,
    html: `
      <p>Hola ${duenoNombre},</p>
      <p>El veterinario ha <b>validado</b> el informe de <b>${mascotaNombre}</b>.</p>
      <p>Adjuntamos el PDF con QR de autenticidad. Sigue las indicaciones médicas adjuntas.</p>
      <p>– PetSalud</p>
    `
  };
}

module.exports = { resultReadyTemplate, resultValidatedTemplate };
