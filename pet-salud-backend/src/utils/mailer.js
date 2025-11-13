const nodemailer = require('nodemailer');

const port = Number(process.env.SMTP_PORT || 465);
const isSecure = port === 465;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: isSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { ciphers: 'TLSv1.2' },
});

/**
 * Enviar correo
 * @param {Object} params
 * @param {string|string[]} params.to
 * @param {string} params.subject
 * @param {string} [params.html]
 * @param {string} [params.text]
 * @param {Array}  [params.attachments] - [{ filename, content|path, contentType }]
 */
async function sendMail({ to, subject, html, text, attachments = [] }) {
  const from = process.env.SENDER_EMAIL || process.env.SMTP_USER;
  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text,
    attachments,
  });
  console.log('📧 Email enviado correctamente:', info.messageId, 'Adjuntos:', attachments.length);
  return info;
}

module.exports = { sendMail };
