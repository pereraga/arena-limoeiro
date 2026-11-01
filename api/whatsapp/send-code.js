import crypto from 'crypto';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://evolution-api-latest-4n78.onrender.com';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'ArenaLimoeiro2026Sec';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'arena-limoeiro';
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
    const { phone } = body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Número de telefone é obrigatório.' });
    }

    const clean = String(phone).replace(/\D/g, '');
    if (clean.length < 10 || clean.length > 13) {
      return res.status(200).json({
        success: false,
        message: 'Número inválido. Informe o WhatsApp com DDD (10 ou 11 dígitos).'
      });
    }

    const formatted = clean.startsWith('55') ? clean : ('55' + clean);

    // 1. Verifica se o número existe no WhatsApp através da Evolution API
    try {
      const checkRes = await fetch(`${EVOLUTION_API_URL}/chat/whatsappNumbers/${EVOLUTION_INSTANCE}`, {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ numbers: [formatted] })
      });

      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (Array.isArray(checkData) && checkData.length > 0) {
          if (checkData[0].exists !== true) {
            return res.status(200).json({
              success: false,
              isReal: false,
              message: 'Este número não é real ou não possui conta de WhatsApp ativa.'
            });
          }
        }
      }
    } catch (checkErr) {
      console.warn('Aviso ao checar número no WhatsApp:', checkErr);
    }

    // 2. Gera código aleatório de 4 dígitos (ex: 4829)
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutos de validade

    // Gera token HMAC criptográfico
    const hmac = crypto.createHmac('sha256', OTP_SECRET)
      .update(`${formatted}:${code}:${expiresAt}`)
      .digest('hex');
    const token = `${hmac}.${expiresAt}`;

    // 3. Dispara a mensagem com o código para o WhatsApp do cliente
    const msg = 
      `🏟️ *ARENA LIMOEIRO - CÓDIGO DE CONFIRMAÇÃO*\n\n` +
      `Seu código de verificação para cadastro é: *${code}*\n\n` +
      `Digite este código no site da Arena para confirmar que o WhatsApp é seu e liberar os dados para o agendamento! ⚽`;

    const sendRes = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: formatted,
        text: msg
      })
    });

    const sendData = await sendRes.json();

    return res.status(200).json({
      success: true,
      isReal: true,
      token: token,
      message: 'Código de 4 dígitos enviado com sucesso para o seu WhatsApp!'
    });

  } catch (error) {
    console.error('Erro ao enviar código de verificação:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
