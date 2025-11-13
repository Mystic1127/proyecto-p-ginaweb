const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { buildValidationURL } = require('./qr');

async function composePDF(doc, data) {
  doc.fontSize(18).text('Veterinaria PetSalud - Informe de Análisis', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Orden #${data.orden.id_orden}   |   Estado: ${data.orden.estado}   |   Fecha: ${new Date(data.orden.creado_en).toLocaleString()}`);
  doc.moveDown();

  doc.fontSize(12).text('Datos del Dueño', { underline: true });
  doc.fontSize(10).text(`${data.dueno.nombres} ${data.dueno.apellidos}`);
  if (data.dueno.telefono) doc.text(`Tel: ${data.dueno.telefono}`);
  if (data.dueno.email) doc.text(`Email: ${data.dueno.email}`);
  doc.moveDown(0.5);

  doc.fontSize(12).text('Datos de la Mascota', { underline: true });
  doc.fontSize(10).text(`Nombre: ${data.mascota.nombre}`);
  doc.text(`Especie: ${data.mascota.especie}  |  Raza: ${data.mascota.raza || '-'}`);
  if (data.mascota.edad != null) doc.text(`Edad: ${data.mascota.edad} años`);
  doc.text(`Sexo: ${data.mascota.sexo}`);
  doc.moveDown();

  doc.fontSize(12).text('Orden de Análisis', { underline: true });
  doc.fontSize(10).text(`Tipo de examen: ${data.orden.tipo_examen}`);
  if (data.orden.observaciones) doc.text(`Observaciones: ${data.orden.observaciones}`);
  doc.moveDown();

  doc.fontSize(12).text('Resultados', { underline: true });
  if (data.resultado) {
    doc.fontSize(10).text(`Descripción: ${data.resultado.descripcion || '-'}`);
    try {
      const valores = typeof data.resultado.valores === 'string'
        ? JSON.parse(data.resultado.valores)
        : (data.resultado.valores || {});
      Object.entries(valores).forEach(([k, v]) => doc.text(`• ${k}: ${v}`));
    } catch {
      doc.text(`Valores: ${data.resultado.valores}`);
    }
    if (data.resultado.conclusiones) doc.text(`Conclusiones: ${data.resultado.conclusiones}`);
    doc.moveDown(0.5);
    doc.text(`Validado: ${data.resultado.validado ? 'Sí' : 'No'}`);
    if (data.resultado.validado && data.vet_validador) {
      doc.text(`Veterinario validador: ${data.vet_validador.nombres || ''} ${data.vet_validador.apellidos || ''}`);
    }
  } else {
    doc.fontSize(10).text('Aún no hay resultado registrado.');
  }
  doc.moveDown();

  const rid = data.resultado ? data.resultado.id_resultado : '0';
  const url = buildValidationURL(rid);
  const qrDataUrl = await QRCode.toDataURL(url, { margin: 1, scale: 5 });
  const img = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  doc.fontSize(10).text('Escanea el QR para validar la autenticidad del informe:');
  doc.image(img, { fit: [120, 120] });

  doc.moveDown(0.5);
  doc.fillColor('blue').text(url, { link: url, underline: true });
  doc.fillColor('black');

  doc.moveDown(1);
  doc.fontSize(8).text('Documento generado automáticamente por PetSalud SGV.', { align: 'center' });
}

async function generateOrderReportPDF(res, data) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename=PetSalud_Orden_${data.orden.id_orden}.pdf`);
  doc.pipe(res);
  await composePDF(doc, data);
  doc.end();
}

async function generateOrderReportPDFBuffer(data) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      await composePDF(doc, data);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateOrderReportPDF, generateOrderReportPDFBuffer };
