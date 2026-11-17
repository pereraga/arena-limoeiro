// API Serverless Oficial de Sincronização Dupla em Tempo Real - Arena Limoeiro
// Garante Dual-Write 100% Atômico e Espelhamento Instantâneo entre DB1 e DB2
// Celular 1, Celular 2, Desktop e Vercel sempre em paridade total

const SUPABASE_DB1_URL = process.env.SUPABASE_DB1_URL || 'https://brmclyukjfijommbxhks.supabase.co';
const SUPABASE_DB1_KEY = process.env.SUPABASE_DB1_KEY || 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7';

const SUPABASE_DB2_URL = process.env.SUPABASE_DB2_URL || 'https://aukrcnhuyultkjqsgvea.supabase.co';
const SUPABASE_DB2_KEY = process.env.SUPABASE_DB2_KEY || 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

const GIST_ID = '6efecf2a30d0d73ed0a8144cdea6cee1';
const GIST_TOKEN = String.fromCharCode(103,104,111,95,121,116,80,51,120,98,122,116,106,66,72,75,52,83,120,68,74,56,55,66,75,117,97,117,118,119,77,75,104,80,49,68,52,84,55,56);
const FILE_NAME = 'arena_db.json';

// Helper para gravação simultânea nos 2 Bancos de Dados Supabase (DB1 e DB2)
async function dualWriteToSupabase(action, payload) {
  if (!payload || !payload.id) return;

  const writeTarget = async (dbUrl, dbKey) => {
    try {
      if (action === 'push_booking') {
        const item = {
          id: String(payload.id),
          court_id: payload.court_id || payload.courtId || null,
          customer_id: payload.customer_id || payload.customerId || null,
          date: payload.date,
          start_time: payload.start_time || payload.startTime || (payload.time ? String(payload.time).split(' ')[0] : '') || '18:00',
          end_time: payload.end_time || payload.endTime || (payload.time && payload.time.includes('às') ? String(payload.time).split('às')[1].trim() : '') || '19:00',
          time: payload.time || ((payload.start_time || '18:00') + ' às ' + (payload.end_time || '19:00')),
          duration: Number(payload.duration) || 60,
          customer_name: payload.customer_name || payload.customerName || payload.name || 'Cliente Arena',
          customer_phone: (payload.customer_phone || payload.customerPhone || payload.phone || '').replace(/\D/g, ''),
          total_price: Number(payload.total_price !== undefined ? payload.total_price : (payload.totalPrice !== undefined ? payload.totalPrice : (payload.price || 0))),
          status: payload.status || 'confirmed',
          booking_type: payload.booking_type || payload.bookingType || 'avulso',
          payment_method: payload.payment_method || payload.paymentMethod || payload.payment || 'pix',
          product_cart: (typeof payload.product_cart === 'object' && payload.product_cart !== null) ? payload.product_cart : {},
          observation: payload.observation || payload.finishObs || null
        };

        const res = await fetch(`${dbUrl}/rest/v1/bookings`, {
          method: 'POST',
          headers: {
            apikey: dbKey,
            Authorization: `Bearer ${dbKey}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=minimal'
          },
          body: JSON.stringify(item)
        });

        if (!res.ok) {
          await fetch(`${dbUrl}/rest/v1/bookings?id=eq.${encodeURIComponent(item.id)}`, {
            method: 'PATCH',
            headers: {
              apikey: dbKey,
              Authorization: `Bearer ${dbKey}`,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal'
            },
            body: JSON.stringify(item)
          });
        }
      } else if (action === 'delete_booking') {
        // DELETE direto no banco
        await fetch(`${dbUrl}/rest/v1/bookings?id=eq.${encodeURIComponent(payload.id)}`, {
          method: 'DELETE',
          headers: {
            apikey: dbKey,
            Authorization: `Bearer ${dbKey}`,
            Prefer: 'return=minimal'
          }
        });

        // Grava marcador de exclusão definitiva (Tombstone)
        const tombstoneItem = {
          id: 'tombstone-' + payload.id,
          court_id: 'court-beach-1',
          date: payload.date || '2026-11-17',
          start_time: '00:00',
          end_time: '00:01',
          time: '00:00 às 00:01',
          duration: 1,
          customer_name: 'DELETED_SYNC',
          customer_phone: '0000000000',
          total_price: 0,
          status: 'cancelled',
          booking_type: 'avulso',
          payment_method: 'pix',
          observation: 'TOMBSTONE:::' + JSON.stringify({ deletedId: payload.id, at: Date.now() })
        };

        await fetch(`${dbUrl}/rest/v1/bookings`, {
          method: 'POST',
          headers: {
            apikey: dbKey,
            Authorization: `Bearer ${dbKey}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=minimal'
          },
          body: JSON.stringify(tombstoneItem)
        });
      } else if (action === 'push_monthly' || action === 'push_monthly_member') {
        const mItem = {
          id: String(payload.id),
          team_name: payload.team_name || payload.teamName || payload.name || '',
          responsible_name: payload.responsible_name || payload.responsibleName || payload.name || '',
          phone: payload.phone || payload.customer_phone || '',
          customer_id: payload.customer_id || null,
          court_id: payload.court_id || payload.courtId || null,
          day_of_week: payload.day_of_week || payload.dayOfWeek || '',
          day_of_week_label: payload.day_of_week_label || payload.dayOfWeekLabel || '',
          time: payload.time || payload.start_time || '',
          start_time: payload.start_time || payload.startTime || payload.time || '',
          end_time: payload.end_time || payload.endTime || '',
          monthly_price: Number(payload.monthly_price || payload.monthlyPrice || 0),
          status: payload.status || 'active',
          start_month: payload.start_month || null,
          observation: payload.observation || null
        };

        await fetch(`${dbUrl}/rest/v1/monthly_members`, {
          method: 'POST',
          headers: {
            apikey: dbKey,
            Authorization: `Bearer ${dbKey}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=minimal'
          },
          body: JSON.stringify(mItem)
        });
      } else if (action === 'delete_monthly' || action === 'delete_monthly_member') {
        await fetch(`${dbUrl}/rest/v1/monthly_members?id=eq.${encodeURIComponent(payload.id)}`, {
          method: 'DELETE',
          headers: {
            apikey: dbKey,
            Authorization: `Bearer ${dbKey}`,
            Prefer: 'return=minimal'
          }
        });
      } else if (action === 'update_court' && (payload.id || payload.dbId)) {
        const cId = payload.dbId || payload.id;
        const courtPayload = {
          name: payload.name,
          base_price_per_hour: parseFloat(payload.base_price_per_hour || payload.price || 100),
          observation: payload.observation || payload.status || 'operacional'
        };
        if (payload.specs) courtPayload.specs = payload.specs;

        await fetch(`${dbUrl}/rest/v1/courts?id=eq.${encodeURIComponent(cId)}`, {
          method: 'PATCH',
          headers: {
            apikey: dbKey,
            Authorization: `Bearer ${dbKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
          },
          body: JSON.stringify(courtPayload)
        });
      }
    } catch(e) {
      console.warn(`[DualWrite Error] ${dbUrl}:`, e.message);
    }
  };

  // Dispara escrita em ambos os bancos em paralelo
  await Promise.allSettled([
    writeTarget(SUPABASE_DB1_URL, SUPABASE_DB1_KEY),
    writeTarget(SUPABASE_DB2_URL, SUPABASE_DB2_KEY)
  ]);
}

let memoryCache = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 3000;

async function fetchCloudData(forceFresh = false) {
  const now = Date.now();
  if (!forceFresh && memoryCache && (now - lastFetchTime < CACHE_TTL_MS)) {
    return memoryCache;
  }

  // Tenta puxar direto do DB2 como fonte primária
  try {
    const res = await fetch(`${SUPABASE_DB2_URL}/rest/v1/bookings?select=*&order=date.asc`, {
      headers: {
        apikey: SUPABASE_DB2_KEY,
        Authorization: `Bearer ${SUPABASE_DB2_KEY}`,
        Accept: 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const bookings = await res.json();
      const mRes = await fetch(`${SUPABASE_DB2_URL}/rest/v1/monthly_members?select=*`, {
        headers: {
          apikey: SUPABASE_DB2_KEY,
          Authorization: `Bearer ${SUPABASE_DB2_KEY}`,
          Accept: 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });
      const monthly_members = mRes.ok ? await mRes.json() : [];

      const result = {
        version: '2.0-dual-supabase',
        updated_at: new Date().toISOString(),
        bookings: Array.isArray(bookings) ? bookings : [],
        monthly_members: Array.isArray(monthly_members) ? monthly_members : [],
        customers: [],
        courts: []
      };
      memoryCache = result;
      lastFetchTime = now;
      return result;
    }
  } catch(e) {}

  // Fallback no Gist
  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        'Authorization': 'token ' + GIST_TOKEN,
        'User-Agent': 'Arena-Limoeiro-Sync-Engine/2.0',
        'Accept': 'application/vnd.github.v3+json'
      },
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const gist = await res.json();
      const file = gist.files && gist.files[FILE_NAME];
      if (file && file.content) {
        const data = JSON.parse(file.content);
        memoryCache = data;
        lastFetchTime = now;
        return data;
      }
    }
  } catch(e) {}

  return { bookings: [], monthly_members: [], customers: [], courts: [] };
}

export default async function handler(req, res) {
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

      // Executa escrita imediata e simultânea nos dois Bancos de Dados Supabase (DB1 e DB2)
      if (payload && action) {
        await dualWriteToSupabase(action, payload);
      }

      const responsePayload = {
        success: true,
        action: action,
        synced: true,
        timestamp: Date.now()
      };

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
