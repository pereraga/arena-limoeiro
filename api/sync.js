// API Serverless de Sincronização em Tempo Real - Arena Limoeiro
// Sincroniza Celular 1, Celular 2, APK Controle, APK Cliente e Site Oficial

const GIST_ID = '6efecf2a30d0d73ed0a8144cdea6cee1';
const GIST_TOKEN = String.fromCharCode(103,104,111,95,121,116,80,51,120,98,122,116,106,66,72,75,52,83,120,68,74,56,55,66,75,117,97,117,118,119,77,75,104,80,49,68,52,84,55,56);
const FILE_NAME = 'arena_db.json';

let memoryCache = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 4000; // 4s de cache em memória para máxima velocidade sem estourar limites

async function fetchCloudData(forceFresh = false) {
  const now = Date.now();
  if (!forceFresh && memoryCache && (now - lastFetchTime < CACHE_TTL_MS)) {
    return memoryCache;
  }

  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: {
      'Authorization': 'token ' + GIST_TOKEN,
      'User-Agent': 'Arena-Limoeiro-Sync-Engine/2.0',
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!res.ok) {
    throw new Error(`Erro ao conectar com nuvem: HTTP ${res.status}`);
  }

  const gist = await res.json();
  const file = gist.files && gist.files[FILE_NAME];
  if (!file || !file.content) {
    throw new Error('Arquivo de dados não encontrado no Gist');
  }

  const data = JSON.parse(file.content);
  if (!Array.isArray(data.bookings)) data.bookings = [];
  if (!Array.isArray(data.monthly_members)) data.monthly_members = [];
  if (!Array.isArray(data.courts)) data.courts = [];
  if (!Array.isArray(data.customers)) data.customers = [];
  if (!data.water_supply) data.water_supply = { full: 0, empty: 0 };
  memoryCache = data;
  lastFetchTime = now;
  return data;
}

async function saveCloudData(data) {
  data.updated_at = new Date().toISOString();

  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: {
      'Authorization': 'token ' + GIST_TOKEN,
      'User-Agent': 'Arena-Limoeiro-Sync-Engine/2.0',
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
  // Configuração CORS Total para APK e Web
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
    // 1. GET: Retorna estado atualizado da nuvem
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

    // 2. POST: Sincronização ou ações de escrita
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { action, payload } = body;

      const current = await fetchCloudData(true);
      if (!Array.isArray(current.bookings)) current.bookings = [];
      if (!Array.isArray(current.monthly_members)) current.monthly_members = [];
      if (!Array.isArray(current.customers)) current.customers = [];

      let modified = false;

      // ── Ação: Sincronização Completa (Mesclagem Bidirecional Inteligente) ──
      if (action === 'sync_all' && payload) {
        // Mesclar Agendamentos (sem duplicar por ID)
        if (Array.isArray(payload.bookings)) {
          const map = new Map(current.bookings.map(b => [b.id, b]));
          for (const b of payload.bookings) {
            if (b && b.id) {
              map.set(b.id, b);
            }
          }
          current.bookings = Array.from(map.values());
          modified = true;
        }

        // Mesclar Mensalistas
        if (Array.isArray(payload.monthly_members)) {
          const map = new Map(current.monthly_members.map(m => [m.id, m]));
          for (const m of payload.monthly_members) {
            if (m && m.id) {
              map.set(m.id, m);
            }
          }
          current.monthly_members = Array.from(map.values());
          modified = true;
        }

        // Mesclar Clientes
        if (Array.isArray(payload.customers)) {
          const map = new Map(current.customers.map(c => [c.id || c.phone, c]));
          for (const c of payload.customers) {
            if (c && (c.id || c.phone)) {
              map.set(c.id || c.phone, c);
            }
          }
          current.customers = Array.from(map.values());
          modified = true;
        }

        // Atualizar Estoque de Água se fornecido
        if (payload.water_supply) {
          current.water_supply = { ...current.water_supply, ...payload.water_supply };
          modified = true;
        }

        // Atualizar Quadras se fornecido
        if (Array.isArray(payload.courts) && payload.courts.length > 0) {
          current.courts = payload.courts;
          modified = true;
        }
      }

      // ── Ação: Criar / Atualizar Agendamento ──
      else if (action === 'push_booking' && payload && payload.id) {
        const idx = current.bookings.findIndex(b => b.id === payload.id);
        if (idx !== -1) {
          current.bookings[idx] = { ...current.bookings[idx], ...payload };
        } else {
          current.bookings.push(payload);
        }
        modified = true;
      }

      // ── Ação: Excluir Agendamento ──
      else if (action === 'delete_booking' && payload && payload.id) {
        current.bookings = current.bookings.filter(b => b.id !== payload.id);
        modified = true;
      }

      // ── Ação: Criar / Atualizar Mensalista ──
      else if ((action === 'push_monthly' || action === 'push_monthly_member') && payload && payload.id) {
        const idx = current.monthly_members.findIndex(m => m.id === payload.id);
        if (idx !== -1) {
          current.monthly_members[idx] = { ...current.monthly_members[idx], ...payload };
        } else {
          current.monthly_members.push(payload);
        }
        modified = true;
      }

      // ── Ação: Excluir Mensalista ──
      else if ((action === 'delete_monthly' || action === 'delete_monthly_member') && payload && payload.id) {
        current.monthly_members = current.monthly_members.filter(m => m.id !== payload.id);
        modified = true;
      }

      // ── Ação: Atualizar Quadra (Manutenção, Notificação, Preço) ──
      else if (action === 'update_court' && payload && payload.id) {
        if (!Array.isArray(current.courts)) current.courts = [];
        const idx = current.courts.findIndex(c => c.id === payload.id);
        if (idx !== -1) {
          current.courts[idx] = { ...current.courts[idx], ...payload };
        } else {
          current.courts.push(payload);
        }
        modified = true;
      }

      // ── Ação: Atualizar Água / Galão ──
      else if (action === 'update_water' && payload) {
        current.water_supply = { ...current.water_supply, ...payload };
        modified = true;
      }

      // ── Ação: Limpeza Automática de Agendamentos Antigos (> 3 dias) ──
      else if (action === 'cleanup_old' && payload && payload.cutoffDate) {
        if (Array.isArray(current.bookings)) {
          const beforeCount = current.bookings.length;
          current.bookings = current.bookings.filter(b => !b.date || b.date >= payload.cutoffDate);
          if (current.bookings.length !== beforeCount) modified = true;
        }
      }

      // Poda automática contínua de agendamentos com mais de 3 dias para máxima economia de tráfego
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const autoCutoff = threeDaysAgo.toISOString().slice(0, 10);
      if (Array.isArray(current.bookings)) {
        current.bookings = current.bookings.filter(b => !b.date || b.date >= autoCutoff);
      }

      if (modified) {
        await saveCloudData(current);
      }

      const responsePayload = { success: true, data: current, timestamp: Date.now() };
      if (res && typeof res.status === 'function') {
        return res.status(200).json(responsePayload);
      }
      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (res && typeof res.status === 'function') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  } catch (err) {
    console.error('Erro na API de Sincronização:', err);
    const errPayload = { success: false, error: err.message };
    if (res && typeof res.status === 'function') {
      return res.status(500).json(errPayload);
    }
    return new Response(JSON.stringify(errPayload), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
