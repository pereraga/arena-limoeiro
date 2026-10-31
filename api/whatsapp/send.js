const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://evolution-api-latest-4n78.onrender.com';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'ArenaLimoeiro2026Sec';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'arena-limoeiro';

export default async function handler(req, res) {
  // Configurar cabeçalhos CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, apikey');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { number, text } = body;

    if (!number || !text) {
      return res.status(400).json({ success: false, message: 'Número e mensagem são obrigatórios' });
    }

    const cleanPhone = String(number).replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : ('55' + cleanPhone);

    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: formattedPhone,
        text: text
      })
    });

    const data = await response.json();
    return res.status(200).json({ success: true, result: data });
  } catch (error) {
    console.error('Erro envio WhatsApp:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
