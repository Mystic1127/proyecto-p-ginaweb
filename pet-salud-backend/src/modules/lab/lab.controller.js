const svc = require('./lab.service');
const { verifySignature } = require('../../utils/qr');
const { generateOrderReportPDF, generateOrderReportPDFBuffer } = require('../../utils/report-pdf');
const { sendMail } = require('../../utils/mailer');
const { resultReadyTemplate, resultValidatedTemplate } = require('../../utils/email-templates');
const { getTecnicoIdByUserId } = require('./lab.service');
const factSvc = require('../facturas/facturas.service');

function isStaff(rol) {
  return ['ADMIN', 'RECEPCIONISTA', 'VETERINARIO', 'TECNICO'].includes(rol);
}

/* =====================================================
                       Crear orden
   ===================================================== */
async function crearOrden(req, res) {
  try {
    const rol = req.user.rol;
    const vetId = (rol === 'VETERINARIO') ? req.user.id : null; // opcional (si el vet crea la orden)
    const out = await svc.crearOrden({ idUsuario: req.user.id, body: req.body, idVetOpt: vetId });
    return res.status(201).json(out);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}

/* =====================================================
                    Toma de muestra
   ===================================================== */
async function tomaMuestra(req, res) {
  try {
    if (!['TECNICO', 'VETERINARIO', 'ADMIN'].includes(req.user.rol)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const payload = { ...req.body };

    if (req.user.rol === 'TECNICO' && !payload.id_tecnico) {
      payload.id_tecnico = await getTecnicoIdByUserId(req.user.id);
    }

    const out = await svc.registrarToma(payload);
    return res.json(out);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}

/* =====================================================
                 Registrar resultado
   ===================================================== */
async function registrarResultado(req, res) {
  try {
    if (!['TECNICO', 'ADMIN'].includes(req.user.rol)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const out = await svc.registrarResultado(req.body);

    try {
      const data = await svc.getDataForReport(req.body.id_orden);
      if (data?.dueno?.email) {
        const t = resultReadyTemplate({
          duenoNombre: `${data.dueno.nombres} ${data.dueno.apellidos}`,
          mascotaNombre: data.mascota.nombre,
          idOrden: data.orden.id_orden
        });
        await sendMail({ to: data.dueno.email, subject: t.subject, html: t.html });
      }
    } catch (err) {
      console.warn('No se pudo enviar email de resultados:', err.message);
    }

    return res.json(out);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}

/* =====================================================
                  Validar resultado
   ===================================================== */
async function validar(req, res) {
  try {
    if (!['VETERINARIO', 'ADMIN'].includes(req.user.rol)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { id_orden } = req.body;
    const out = await svc.validarResultado({ id_orden, id_veterinario: req.user.id });

    let factura = null;
    let facturaError = null;

    try {
      console.log('🧾 Hook facturas: intentando crear por orden', id_orden);
      factura = await factSvc.crearFacturaPorOrdenValidada({ id_orden });
      console.log('✅ Factura por orden validada creada:', factura);
    } catch (e) {
      facturaError = e.message;
      console.warn('⚠️ No se pudo crear factura por orden validada:', e.message);
    }

    try {
      const data = await svc.getDataForReport(id_orden);
      if (data?.dueno?.email) {
        const pdfBuffer = await generateOrderReportPDFBuffer(data);
        const subject = `Informe validado – Orden #${data.orden.id_orden}`;
        const html = `
          <p>Hola ${data.dueno.nombres} ${data.dueno.apellidos},</p>
          <p>El veterinario ha <b>validado</b> el informe de <b>${data.mascota.nombre}</b>.</p>
          <p>Te adjuntamos el PDF con QR de autenticidad.</p>
          <p>– PetSalud</p>
        `;
        await sendMail({
          to: data.dueno.email,
          subject,
          html,
          attachments: [{
            filename: `PetSalud_Orden_${data.orden.id_orden}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }]
        });
      }
    } catch (err) {
      console.warn('No se pudo enviar email de validación con PDF:', err.message);
    }

    return res.json({ ok: true, factura, facturaError });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}

/* =====================================================
                      Consultas
   ===================================================== */
async function detalle(req, res) {
  try {
    const data = await svc.detalleOrden(req.user.id, req.params.id);
    if (req.user.rol === 'DUENO') {
      await svc.assertMascotaIsMine(req.user.id, data.id_mascota);
    }
    return res.json(data);
  } catch (e) {
    return res.status(404).json({ error: e.message });
  }
}

async function listar(req, res) {
  try {
    const data = isStaff(req.user.rol)
      ? await svc.listarOrdenesAdmin()
      : await svc.listarOrdenesDueno(req.user.id);

    return res.json(data);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}

/* =====================================================
              Generar informe PDF con QR
   ===================================================== */
async function informe(req, res) {
  try {
    const id_orden = req.params.id;
    const data = await svc.getDataForReport(id_orden);

    if (req.user.rol === 'DUENO') {
      await svc.assertMascotaIsMine(req.user.id, data.mascota.id_mascota);
    }

    await generateOrderReportPDF(res, data);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}

async function validarQR(req, res) {
  try {
    const { rid, sig } = req.query;
    if (!rid || !sig) return res.status(400).json({ valido: false, error: 'Parámetros faltantes' });

    const ok = verifySignature(String(rid), String(sig));
    return res.json({ valido: ok, rid: Number(rid) });
  } catch (e) {
    return res.status(400).json({ valido: false, error: e.message });
  }
}

module.exports = {
  crearOrden,
  tomaMuestra,
  registrarResultado,
  validar,
  detalle,
  listar,
  informe,
  validarQR,
};
