import crypto from 'crypto';

const OTP_SECRET = process.env.OTP_SECRET || 'ArenaLimoeiroSecretOTPKey2026';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, apikey');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { phone, code, token } = body;

    if (!phone || !code || !token) {
      return res.status(400).json({
        verified: false,
        message: 'Telefone, código e token são obrigatórios.'
      });
    }

    const clean = String(phone).replace(/\D/g, '');
    const formatted = clean.startsWith('55') ? clean : ('55' + clean);
    const cleanCode = String(code).trim();

    if (!token.includes('.')) {
      return res.status(200).json({
        verified: false,
        message: 'Token de verificação inválido.'
      });
    }

    const [hmac, expiresAtStr] = token.split('.');
    const expiresAt = Number(expiresAtStr);

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return res.status(200).json({
        verified: false,
        message: 'O código de verificação expirou. Solicite um novo código.'
      });
    }

    const expectedHmac = crypto.createHmac('sha256', OTP_SECRET)
      .update(`${formatted}:${cleanCode}:${expiresAt}`)
      .digest('hex');

    if (hmac === expectedHmac) {
      return res.status(200).json({
        verified: true,
        message: 'Código confirmado com sucesso! Número autenticado.'
      });
    } else {
      return res.status(200).json({
        verified: false,
        message: 'Código incorreto. Verifique o número de 4 dígitos enviado no seu WhatsApp.'
      });
    }

  } catch (error) {
    console.error('Erro ao verificar código:', error);
    return res.status(500).json({ verified: false, error: error.message });
  }
}
