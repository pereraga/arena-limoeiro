const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://evolution-api-latest-4n78.onrender.com';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'ArenaLimoeiro2026Sec';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'arena-limoeiro';

// Cache em memória de curta duração (máximo 14 segundos) para evitar requisições duplicadas simultâneas
let liveQrCache = {
  data: null,
  timestamp: 0
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, apikey');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const force = req.query && (req.query.force === 'true' || req.query.renew === 'true');
  const now = Date.now();

  // Se já temos um QR Code recente gerado há menos de 10 segundos e não foi forçado renovação
  if (!force && liveQrCache.data && (now - liveQrCache.timestamp < 10000)) {
    return res.status(200).json(liveQrCache.data);
  }

  try {
    if (force) {
      liveQrCache.data = null;
      liveQrCache.timestamp = 0;
    }

    // Timeout confortável de 8.5s para conexões remotas
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8500);

    const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${EVOLUTION_INSTANCE}`, {
      headers: { 'apikey': EVOLUTION_API_KEY },
      signal: controller.signal
    });
    clearTimeout(timer);

    const data = await response.json();

    if (data && (data.base64 || data.code)) {
      liveQrCache = {
        data: {
          pairingCode: data.pairingCode || null,
          code: data.code || null,
          base64: data.base64 || null,
          count: data.count || 1,
          live: true,
          expiresInSeconds: 20,
          updatedAt: new Date().toISOString()
        },
        timestamp: now
      };
      return res.status(200).json(liveQrCache.data);
    }

    if (data && data.instance && data.instance.state === 'open') {
      return res.status(200).json(data);
    }

    // Se a Evolution API retornou sem erro mas sem QR code pronto ainda
    return res.status(200).json({
      pairingCode: null,
      code: null,
      base64: null,
      retry: true,
      message: 'Evolution API aguardando inicialização do socket Baileys.'
    });

  } catch (error) {
    return res.status(502).json({
      error: true,
      message: 'Erro ao conectar à Evolution API: ' + (error.message || 'Timeout')
    });
  }
}
