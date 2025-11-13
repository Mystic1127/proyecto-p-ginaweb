const crypto = require('crypto');

function signPayload(payload) {
  const secret = process.env.QR_SECRET || 'qr_secret';
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function buildValidationURL(resultId) {
  const base = process.env.APP_BASE_URL || 'http://localhost:5000';
  const payload = `rid=${resultId}`;
  const sig = signPayload(payload);
  return `${base}/lab/validar-qr?${payload}&sig=${sig}`;
}

function verifySignature(rid, sig) {
  const payload = `rid=${rid}`;
  const expected = signPayload(payload);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}

module.exports = { buildValidationURL, verifySignature };
