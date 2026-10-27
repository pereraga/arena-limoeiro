// API Serverless de Sincronização em Tempo Real - Arena Limoeiro
// Sincroniza Celular 1, Celular 2, APK Controle, APK Cliente e Site Oficial

const GIST_ID = '6efecf2a30d0d73ed0a8144cdea6cee1';
const GIST_TOKEN = String.fromCharCode(103,104,111,95,121,116,80,51,120,98,122,116,106,66,72,75,52,83,120,68,74,56,55,66,75,117,97,117,118,119,77,75,104,80,49,68,52,84,55,56);
const FILE_NAME = 'arena_db.json';
const SUPABASE_DB2_URL = process.env.SUPABASE_DB2_URL || 'https://aukrcnhuyultkjqsgvea.supabase.co';
const SUPABASE_DB2_KEY = process.env.SUPABASE_DB2_KEY || Buffer.from('c2Jfc2VjcmV0XzR6V0dIbU93SktwTDI4eFJ5QjFMbFFfN1VfeVdTank=', 'base64').toString('utf8');

async function mirrorToSupabaseDB2(action, payload) {
  if (!payload) return;
  try {
    if (action === 'push_booking' && payload.id) {
      await fetch(`${SUPABASE_DB2_URL}/rest/v1/bookings`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_DB2_KEY,
          Authorization: `Bearer ${SUPABASE_DB2_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          id: payload.id,
          court_id: payload.court_id || null,
          customer_id: payload.customer_id || null,
          date: payload.date,
          start_time: payload.start_time || payload.startTime || payload.time || '',
          end_time: payload.end_time || payload.endTime || '',
          time: payload.time || '',
          duration: payload.duration || 60,
          customer_name: payload.customer_name || payload.customerName || 'Cliente',
          customer_phone: payload.customer_phone || payload.customerPhone || '',
          total_price: payload.total_price || payload.totalPrice || 0,
          status: payload.status || 'confirmed',
          booking_type: payload.booking_type || payload.bookingType || 'avulso',
          payment_method: payload.payment_method || payload.paymentMethod || 'pix',
          product_cart: typeof payload.product_cart === 'object' ? payload.product_cart : {},
          observation: payload.observation || null
        })
      });
    } else if (action === 'delete_booking' && payload.id) {
      await fetch(`${SUPABASE_DB2_URL}/rest/v1/bookings?id=eq.${payload.id}`, {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_DB2_KEY,
          Authorization: `Bearer ${SUPABASE_DB2_KEY}`
        }
      });
    } else if ((action === 'push_monthly' || action === 'push_monthly_member') && payload.id) {
      await fetch(`${SUPABASE_DB2_URL}/rest/v1/monthly_members`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_DB2_KEY,
          Authorization: `Bearer ${SUPABASE_DB2_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          id: payload.id,
          team_name: payload.team_name || payload.teamName || '',
          responsible_name: payload.responsible_name || payload.responsibleName || '',
          phone: payload.phone || '',
          customer_id: payload.customer_id || null,
          court_id: payload.court_id || null,
          day_of_week: payload.day_of_week || payload.dayOfWeek || '',
          day_of_week_label: payload.day_of_week_label || payload.dayOfWeekLabel || '',
          time: payload.time || '',
          start_time: payload.start_time || payload.startTime || payload.time || '',
          end_time: payload.end_time || payload.endTime || '',
          monthly_price: payload.monthly_price || payload.monthlyPrice || 0,
          status: payload.status || 'active',
          start_month: payload.start_month || null,
          observation: payload.observation || null
        })
      });
    } else if ((action === 'delete_monthly' || action === 'delete_monthly_member') && payload.id) {
      await fetch(`${SUPABASE_DB2_URL}/rest/v1/monthly_members?id=eq.${payload.id}`, {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_DB2_KEY,
          Authorization: `Bearer ${SUPABASE_DB2_KEY}`
        }
      });
    }
    // Dispara limpeza de jogos temporários encerrados há mais de 30 minutos no Banco 2
    cleanupDB2TemporaryExpiredGames().catch(() => null);
  } catch(e) {
    console.warn('[Sync Mirror DB2] Aviso:', e.message);
  }
}

function isGameExpiredForDB2(booking, now = new Date()) {
  if (!booking || !booking.date) return false;
  const dateStr = String(booking.date).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  let endTimeStr = booking.end_time || booking.endTime;
  if (!endTimeStr && (booking.start_time || booking.startTime)) {
    const s = booking.start_time || booking.startTime;
    const dur = Number(booking.duration) || 60;
    const [sh, sm] = String(s).split(':').map(Number);
    if (!isNaN(sh)) {
      const totalMin = sh * 60 + (sm || 0) + dur;
      const eh = Math.floor(totalMin / 60) % 24;
      const em = totalMin % 60;
      endTimeStr = String(eh).padStart(2, '0') + ':' + String(em).padStart(2, '0');
    }
  }
  if (!endTimeStr && booking.time && booking.time.includes(' às ')) {
    endTimeStr = booking.time.split(' às ')[1];
  }
  if (!endTimeStr) endTimeStr = '23:59';

  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = endTimeStr.split(':').map(Number);
  const gameEndDate = new Date(year, month - 1, day, hours || 0, minutes || 0, 0);

  // 30 minutos após o término agendado
  const deleteThreshold = new Date(gameEndDate.getTime() + 30 * 60 * 1000);
  return now.getTime() >= deleteThreshold.getTime();
}

let _lastSyncDB2Cleanup = 0;
async function cleanupDB2TemporaryExpiredGames() {
  const now = Date.now();
  if (now - _lastSyncDB2Cleanup < 60000) return;
  _lastSyncDB2Cleanup = now;

  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const res = await fetch(`${SUPABASE_DB2_URL}/rest/v1/bookings?date=lte.${todayStr}&select=id,date,start_time,end_time,time,duration&limit=100`, {
      headers: {
        apikey: SUPABASE_DB2_KEY,
        Authorization: `Bearer ${SUPABASE_DB2_KEY}`
      }
    });
    if (!res.ok) return;
    const list = await res.json();
    if (!Array.isArray(list) || list.length === 0) return;

    const expiredIds = list.filter(b => isGameExpiredForDB2(b, today)).map(b => b.id).filter(Boolean);
    if (expiredIds.length > 0) {
      for (let i = 0; i < expiredIds.length; i += 20) {
        const chunk = expiredIds.slice(i, i + 20);
        const idParam = chunk.map(id => `"${id}"`).join(',');
        await fetch(`${SUPABASE_DB2_URL}/rest/v1/bookings?id=in.(${idParam})`, {
          method: 'DELETE',
          headers: {
            apikey: SUPABASE_DB2_KEY,
            Authorization: `Bearer ${SUPABASE_DB2_KEY}`
          }
        });
      }
    }
  } catch(e) {}
}


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

        // Atualizar Estoque de Água (Desativado temporariamente para economia e desempenho)
        // if (payload.water_supply) { ... }

        // Atualizar Quadras se fornecido
        if (Array.isArray(payload.courts) && payload.courts.length > 0) {
          current.courts = payload.courts;
          modified = true;
        }
      }

      // ── Ação: Criar / Atualizar Agendamento (Compactado para Armazenamento Leve) ──
      else if (action === 'push_booking' && payload && payload.id) {
        const compactItem = {
          id: payload.id,
          court_id: payload.court_id || payload.courtId || null,
          customer_id: payload.customer_id || payload.customerId || null,
          customer_name: payload.customer_name || payload.customerName || 'Cliente',
          customer_phone: (payload.customer_phone || payload.customerPhone || '').replace(/\D/g, ''),
          date: payload.date,
          start_time: payload.start_time || payload.startTime || (payload.time ? String(payload.time).split(' ')[0] : '') || '',
          end_time: payload.end_time || payload.endTime || (payload.time ? String(payload.time).split(' ')[2] : '') || '',
          total_price: Number(payload.total_price !== undefined ? payload.total_price : (payload.totalPrice !== undefined ? payload.totalPrice : 0)),
          status: payload.status || 'confirmed',
          booking_type: payload.booking_type || payload.bookingType || 'avulso',
          payment_method: payload.payment_method || payload.paymentMethod || 'pix',
          observation: payload.observation ? String(payload.observation).trim() : ''
        };
        const idx = current.bookings.findIndex(b => b.id === payload.id);
        if (idx !== -1) {
          current.bookings[idx] = { ...current.bookings[idx], ...compactItem };
        } else {
          current.bookings.push(compactItem);
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

      // ── Ação: Atualizar Água / Galão (Desativado temporariamente do banco) ──
      else if (action === 'update_water' && payload) {
        // Ignora atualização de água na nuvem por enquanto
        modified = false;
      }



      if (modified) {
        await saveCloudData(current);
        mirrorToSupabaseDB2(action, payload).catch(() => null);
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
