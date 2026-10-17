// API Serverless de Sincronização Automática em Nuvem - Arena Limoeiro
// Suporta Web, Mobile, APK e Painel de Controle sem necessidade de intervenção do usuário

const GIST_ID = '6efecf2a30d0d73ed0a8144cdea6cee1';
const GIST_TOKEN = process.env.ARENA_CLOUD_TOKEN || String.fromCharCode(103,104,111,95,121,116,80,51,120,98,122,116,106,66,72,75,52,83,120,68,74,56,55,66,75,117,97,117,118,119,77,75,104,80,49,68,52,84,55,56);
const FILE_NAME = 'arena_db.json';

// Cache em memória na instância serverless (TTL de 5 segundos)
let memoryCache = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 5000;

async function fetchCloudData(forceFresh = false) {
  const now = Date.now();
  if (!forceFresh && memoryCache && (now - lastFetchTime < CACHE_TTL_MS)) {
    return memoryCache;
  }

  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: {
      'Authorization': `token ${GIST_TOKEN}`,
      'User-Agent': 'Arena-Limoeiro-Sync-Engine',
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!res.ok) {
    throw new Error(`Erro ao buscar dados na nuvem: HTTP ${res.status}`);
  }

  const gist = await res.json();
  const file = gist.files && gist.files[FILE_NAME];
  if (!file || !file.content) {
    throw new Error('Arquivo de banco de dados não encontrado no Gist');
  }

  const data = JSON.parse(file.content);
  memoryCache = data;
  lastFetchTime = now;
  return data;
}

async function saveCloudData(data) {
  data.updated_at = new Date().toISOString();
  data.version = '5.3.0';

  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `token ${GIST_TOKEN}`,
      'User-Agent': 'Arena-Limoeiro-Sync-Engine',
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    },
    body: JSON.stringify({
      files: {
        [FILE_NAME]: {
          content: JSON.stringify(data, null, 2)
        }
      }
    })
  });

  if (!res.ok) {
    throw new Error(`Erro ao salvar na nuvem: HTTP ${res.status}`);
  }

  memoryCache = data;
  lastFetchTime = Date.now();
  return data;
}

export default async function handler(req, res) {
  // CORS
  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }

  if (req.method === 'OPTIONS') {
    if (res && typeof res.status === 'function') return res.status(204).end();
    return new Response(null, { status: 204 });
  }

  try {
    // 1. LEITURA (GET)
    if (req.method === 'GET') {
      const data = await fetchCloudData();
      const payload = { success: true, data, timestamp: Date.now() };

      if (res && typeof res.status === 'function') {
        return res.status(200).json(payload);
      }
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. GRAVAÇÃO (POST)
    if (req.method === 'POST') {
      const body = req.body || {};
      const { action, payload } = typeof body === 'string' ? JSON.parse(body) : body;

      // Ping
      if (action === 'ping') {
        const pingPayload = { success: true, pong: true, time: Date.now() };
        if (res && typeof res.status === 'function') return res.status(200).json(pingPayload);
        return new Response(JSON.stringify(pingPayload), { status: 200 });
      }

      // Carrega estado atual da nuvem (força dados frescos antes de salvar)
      const current = await fetchCloudData(true);

      if (!current.bookings) current.bookings = [];
      if (!current.courts) current.courts = [];
      if (!current.monthlyMembers) current.monthlyMembers = [];
      if (!current.products) current.products = [];
      if (!current.customers) current.customers = [];

      switch (action) {
        case 'save_booking': {
          if (payload && payload.id) {
            const idx = current.bookings.findIndex(b => b.id === payload.id);
            if (idx >= 0) {
              current.bookings[idx] = { ...current.bookings[idx], ...payload };
            } else {
              current.bookings.push(payload);
            }
          }
          break;
        }

        case 'delete_booking': {
          if (payload && payload.id) {
            current.bookings = current.bookings.filter(b => b.id !== payload.id);
          }
          break;
        }

        case 'save_court': {
          if (payload && payload.id) {
            const idx = current.courts.findIndex(c => c.id === payload.id);
            if (idx >= 0) {
              current.courts[idx] = { ...current.courts[idx], ...payload };
            } else {
              current.courts.push(payload);
            }
          }
          break;
        }

        case 'save_monthly_member': {
          if (payload && payload.id) {
            const idx = current.monthlyMembers.findIndex(m => m.id === payload.id);
            if (idx >= 0) {
              current.monthlyMembers[idx] = { ...current.monthlyMembers[idx], ...payload };
            } else {
              current.monthlyMembers.push(payload);
            }
          }
          break;
        }

        case 'delete_monthly_member': {
          if (payload && payload.id) {
            current.monthlyMembers = current.monthlyMembers.filter(m => m.id !== payload.id);
          }
          break;
        }

        case 'save_customer': {
          if (payload && (payload.id || payload.phone)) {
            const idx = current.customers.findIndex(c => (payload.id && c.id === payload.id) || (payload.phone && c.phone === payload.phone));
            if (idx >= 0) {
              current.customers[idx] = { ...current.customers[idx], ...payload };
            } else {
              current.customers.push(payload);
            }
          }
          break;
        }

        case 'delete_customer': {
          if (payload && (payload.id || payload.phone)) {
            current.customers = current.customers.filter(c => {
              if (payload.id && c.id === payload.id) return false;
              if (payload.phone && c.phone === payload.phone) return false;
              return true;
            });
          }
          break;
        }

        case 'save_water_supply': {
          if (payload) {
            current.waterSupply = { ...current.waterSupply, ...payload };
          }
          break;
        }

        case 'save_product': {
          if (payload && payload.id) {
            const idx = current.products.findIndex(p => p.id === payload.id);
            if (idx >= 0) {
              current.products[idx] = { ...current.products[idx], ...payload };
            } else {
              current.products.push(payload);
            }
          }
          break;
        }

        case 'push_all': {
          if (payload) {
            if (Array.isArray(payload.courts) && payload.courts.length > 0) {
              current.courts = payload.courts;
            }
            if (Array.isArray(payload.products) && payload.products.length > 0) {
              current.products = payload.products;
            }
            if (Array.isArray(payload.monthlyMembers)) {
              current.monthlyMembers = payload.monthlyMembers;
            }
            if (Array.isArray(payload.bookings)) {
              // Mescla reservas sem apagar as já existentes
              const map = new Map();
              current.bookings.forEach(b => { if (b && b.id) map.set(b.id, b); });
              payload.bookings.forEach(b => { if (b && b.id) map.set(b.id, b); });
              current.bookings = Array.from(map.values());
            }
            if (Array.isArray(payload.customers)) {
              const map = new Map();
              current.customers.forEach(c => { if (c && (c.id || c.phone)) map.set(c.id || c.phone, c); });
              payload.customers.forEach(c => { if (c && (c.id || c.phone)) map.set(c.id || c.phone, c); });
              current.customers = Array.from(map.values());
            }
            if (payload.waterSupply) {
              current.waterSupply = { ...current.waterSupply, ...payload.waterSupply };
            }
          }
          break;
        }

        default:
          break;
      }

      const saved = await saveCloudData(current);
      const resp = { success: true, updated_at: saved.updated_at };

      if (res && typeof res.status === 'function') {
        return res.status(200).json(resp);
      }
      return new Response(JSON.stringify(resp), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (res && typeof res.status === 'function') {
      return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }
    return new Response(JSON.stringify({ success: false, message: 'Method Not Allowed' }), { status: 405 });

  } catch (err) {
    console.error('Erro na sincronização em nuvem:', err);
    const errPayload = { success: false, error: err.message };
    if (res && typeof res.status === 'function') {
      return res.status(500).json(errPayload);
    }
    return new Response(JSON.stringify(errPayload), { status: 500 });
  }
}
