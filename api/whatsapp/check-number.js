const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://evolution-api-latest-4n78.onrender.com';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'ArenaLimoeiro2026Sec';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'arena-limoeiro';

// Lista de DDDs válidos no Brasil
const VALID_DDDS = new Set([
  '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '21', '22', '24', '27', '28',
  '31', '32', '33', '34', '35', '37', '38',
  '41', '42', '43', '44', '45', '46', '47', '48', '49',
  '51', '53', '54', '55',
  '61', '62', '63', '64', '65', '66', '67', '68', '69',
  '71', '73', '74', '75', '77', '79',
  '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '91', '92', '93', '94', '95', '96', '97', '98', '99'
]);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, apikey');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ valid: false, message: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { phone } = body;

    if (!phone) {
      return res.status(400).json({ valid: false, exists: false, message: 'Número de telefone é obrigatório.' });
    }

    const clean = String(phone).replace(/\D/g, '');
    let ddd = '';
    let numberPart = '';

    if (clean.startsWith('55') && clean.length >= 12) {
      ddd = clean.slice(2, 4);
      numberPart = clean.slice(4);
    } else if (clean.length === 10 || clean.length === 11) {
      ddd = clean.slice(0, 2);
      numberPart = clean.slice(2);
    } else {
      return res.status(200).json({
        valid: false,
        exists: false,
        message: 'Formato inválido. O telefone deve conter DDD + 8 ou 9 dígitos.'
      });
    }

    // Verifica DDD brasileiro válido
    if (!VALID_DDDS.has(ddd)) {
      return res.status(200).json({
        valid: false,
        exists: false,
        message: `O DDD (${ddd}) informado não é um DDD válido no Brasil.`
      });
    }

    // Números com todos os dígitos iguais são falsos (ex: 99999999999, 11111111111)
    if (/^(\d)\1+$/.test(clean)) {
      return res.status(200).json({
        valid: false,
        exists: false,
        message: 'Número inválido (dígitos repetidos).'
      });
    }

    const formatted = clean.startsWith('55') ? clean : ('55' + clean);

    // Consulta a Evolution API da Arena Limoeiro para verificar se existe no WhatsApp
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/chat/whatsappNumbers/${EVOLUTION_INSTANCE}`, {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ numbers: [formatted] })
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const item = data[0];
          return res.status(200).json({
            valid: true,
            exists: item.exists === true,
            jid: item.jid || null,
            number: item.number || formatted,
            message: item.exists === true
              ? 'Número verificado com sucesso no WhatsApp!'
              : 'Este número não é real ou não possui uma conta de WhatsApp ativa.'
          });
        }
      }
    } catch(errApi) {
      console.warn('Erro ao consultar Evolution API:', errApi);
    }

    // Se a Evolution API estiver temporariamente instável, mas o número passou na validação estrutural rígida de DDD e 9 dígitos:
    const isMobileStructure = (numberPart.length === 9 && numberPart.startsWith('9')) || numberPart.length === 8;
    return res.status(200).json({
      valid: isMobileStructure,
      exists: isMobileStructure,
      number: formatted,
      message: isMobileStructure ? 'Número validado estruturalmente.' : 'Número de celular inválido.'
    });

  } catch (error) {
    console.error('Erro na verificação do número:', error);
    return res.status(500).json({ valid: false, error: error.message });
  }
}
