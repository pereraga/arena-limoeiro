const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '../public/admin.html');
let html = fs.readFileSync(adminPath, 'utf8');

// 1. Substituição de window.syncBookingToCloud
const s1 = html.indexOf('window.syncBookingToCloud = function');
const e1 = html.indexOf('window.pullDataFromCloudDatabases = async function');

if (s1 === -1 || e1 === -1) {
  console.error('Could not find window.syncBookingToCloud block');
  process.exit(1);
}

const newSyncToCloudCode = `// 🛡️ FUNÇÃO OCULTA DE SINCRONIZAÇÃO DUAL AUTOMÁTICA EM TEMPO REAL (DB1 & DB2)
  // Sincroniza imediatamente com os 2 Bancos de Dados Supabase e com a API Serverless na Vercel
  window.__arenaDualSyncHidden = async function(action, entityType, item) {
    if (!item) return;
    const cloud = window.ARENA_CLOUD_DBS || {};
    const db1Url = cloud.db1Url || 'https://brmclyukjfijommbxhks.supabase.co';
    const db1Key = cloud.db1Key || 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7';
    const db2Url = cloud.db2Url || 'https://aukrcnhuyultkjqsgvea.supabase.co';
    const db2Key = cloud.db2Key || 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

    // 1. Envio Imediato para API Serverless da Vercel (/api/sync)
    try {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action === 'delete' ? ('delete_' + entityType) : ('push_' + entityType),
          payload: item
        })
      }).catch(() => {});
    } catch(e) {}

    // 2. Gravação Direta nos 2 Bancos de Dados Supabase (Dual-Cloud Direct)
    const writeDb = async (url, key) => {
      try {
        const table = entityType === 'monthly' ? 'monthly_members' : (entityType === 'court' ? 'courts' : 'bookings');
        if (action === 'delete') {
          await fetch(url + '/rest/v1/' + table + '?id=eq.' + encodeURIComponent(item.id), {
            method: 'DELETE',
            headers: { apikey: key, Authorization: 'Bearer ' + key, Prefer: 'return=minimal' }
          });

          // Grava Tombstone em bookings
          const tsItem = {
            id: 'tombstone-' + item.id,
            court_id: 'court-beach-1',
            date: item.date || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-17'),
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
            observation: 'TOMBSTONE:::' + (entityType === 'monthly' ? 'member:::' : '') + JSON.stringify({ deletedId: item.id, at: Date.now() })
          };
          await fetch(url + '/rest/v1/bookings', {
            method: 'POST',
            headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
            body: JSON.stringify(tsItem)
          });
        } else {
          // Upsert / Insert
          const res = await fetch(url + '/rest/v1/' + table, {
            method: 'POST',
            headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
            body: JSON.stringify(item)
          });
          if (!res.ok) {
            await fetch(url + '/rest/v1/' + table + '?id=eq.' + encodeURIComponent(item.id), {
              method: 'PATCH',
              headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
              body: JSON.stringify(item)
            });
          }
        }
      } catch(e) {}
    };

    // Dispara nos dois bancos ao mesmo tempo
    await Promise.allSettled([
      writeDb(db1Url, db1Key),
      writeDb(db2Url, db2Key)
    ]);

    // Broadcast instantâneo para todas as outras abas
    try {
      const bc = new BroadcastChannel('arena_limoeiro_sync');
      bc.postMessage({ type: entityType + '_updated', action, payload: item });
    } catch(e) {}
  };

  window.syncBookingToCloud = function(booking, action = 'upsert') {
    if (!booking || !booking.id) return;

    const payload = {
      id: String(booking.id),
      court_id: booking.court_id || booking.courtId || 'court-society-1',
      customer_id: booking.customer_id || null,
      date: booking.date || window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-17'),
      start_time: booking.start_time || (booking.time ? booking.time.split(' ')[0] : '16:00'),
      end_time: booking.end_time || (booking.time && booking.time.includes('às') ? booking.time.split('às')[1].trim() : '17:00'),
      time: booking.time || ((booking.start_time || '16:00') + ' às ' + (booking.end_time || '17:00')),
      duration: Number(booking.duration) || 60,
      customer_name: booking.customer_name || booking.name || 'Cliente Arena',
      customer_phone: (booking.customer_phone || booking.phone || '').replace(/\\D/g, ''),
      total_price: Number(booking.total_price !== undefined ? booking.total_price : (booking.price || 0)),
      status: booking.status || 'confirmed',
      booking_type: booking.booking_type || 'avulso',
      payment_method: booking.payment_method || booking.payment || 'pix',
      product_cart: (typeof booking.product_cart === 'object' && booking.product_cart !== null) ? booking.product_cart : {},
      observation: booking.observation || booking.finishObs || null
    };

    // Executa sincronização dual imediata via função oculta
    window.__arenaDualSyncHidden(action, 'booking', payload);
  };

  // Sincronização dual para mensalistas
  window.syncMonthlyMemberToCloud = function(member, action = 'upsert') {
    if (!member || !member.id) return;
    const payload = {
      id: String(member.id),
      team_name: member.team_name || member.teamName || member.name || '',
      responsible_name: member.responsible_name || member.responsibleName || member.name || '',
      phone: member.phone || '',
      customer_id: member.customer_id || null,
      court_id: member.court_id || member.courtId || null,
      day_of_week: member.day_of_week || member.dayOfWeek || '',
      day_of_week_label: member.day_of_week_label || member.dayOfWeekLabel || '',
      time: member.time || member.start_time || '',
      start_time: member.start_time || member.startTime || member.time || '',
      end_time: member.end_time || member.endTime || '',
      monthly_price: Number(member.monthly_price || member.monthlyPrice || 0),
      status: member.status || 'active',
      start_month: member.start_month || null,
      observation: member.observation || null
    };
    window.__arenaDualSyncHidden(action, 'monthly', payload);
  };

  `;

html = html.substring(0, s1) + newSyncToCloudCode + html.substring(e1);
console.log('Successfully replaced window.syncBookingToCloud with __arenaDualSyncHidden');

// 2. Atualizar setupArenaRealtimeSync para escutar DB1 e DB2
const oldRealtimeSetup = `function setupArenaRealtimeSync() {
    if (window.supabase && typeof window.supabase.createClient === 'function' && window.ARENA_CLOUD_DBS) {
      try {
        const rtClient = window.supabase.createClient(cloudDbs.db2Url, cloudDbs.db2Key);
        const channel = rtClient.channel('arena_live_system_sync');
        channel
          .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
            console.log('[Realtime] Alteração detectada em bookings:', payload);
            if (typeof window.pullDataFromCloudDatabases === 'function') window.pullDataFromCloudDatabases();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_members' }, (payload) => {
            console.log('[Realtime] Alteração detectada em monthly_members:', payload);
            if (typeof window.pullDataFromCloudDatabases === 'function') window.pullDataFromCloudDatabases();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'courts' }, (payload) => {
            console.log('[Realtime] Alteração detectada em courts:', payload);
            if (typeof window.pullCourtsFromCloud === 'function') window.pullCourtsFromCloud();
          })
          .subscribe((status) => {
            console.log('[Realtime] Status da conexão Supabase:', status);
          });
        window.__arenaRealtimeChannel = channel;
      } catch(e) {
        console.warn('[Realtime] Aviso ao iniciar websocket realtime:', e);
      }
    }
  }`;

const newRealtimeSetup = `function setupArenaRealtimeSync() {
    if (window.supabase && typeof window.supabase.createClient === 'function' && window.ARENA_CLOUD_DBS) {
      const subscribeDb = (dbUrl, dbKey, channelName) => {
        try {
          const client = window.supabase.createClient(dbUrl, dbKey);
          const channel = client.channel(channelName);
          channel
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
              console.log('[Realtime ' + channelName + '] Alteração em bookings:', payload);
              window.__lastBookingsSig = null;
              if (typeof window.pullDataFromCloudDatabases === 'function') window.pullDataFromCloudDatabases();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_members' }, (payload) => {
              console.log('[Realtime ' + channelName + '] Alteração em monthly_members:', payload);
              window.__lastMembersSig = null;
              if (typeof window.pullDataFromCloudDatabases === 'function') window.pullDataFromCloudDatabases();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'courts' }, (payload) => {
              console.log('[Realtime ' + channelName + '] Alteração em courts:', payload);
              if (typeof window.pullCourtsFromCloud === 'function') window.pullCourtsFromCloud();
            })
            .subscribe((status) => {
              console.log('[Realtime ' + channelName + '] Status:', status);
            });
          return channel;
        } catch(e) {
          console.warn('[Realtime ' + channelName + '] Aviso:', e);
          return null;
        }
      };

      window.__arenaRealtimeChannel2 = subscribeDb(cloudDbs.db2Url, cloudDbs.db2Key, 'arena_live_db2');
      window.__arenaRealtimeChannel1 = subscribeDb(cloudDbs.db1Url, cloudDbs.db1Key, 'arena_live_db1');
    }
  }`;

if (html.includes(oldRealtimeSetup)) {
  html = html.replace(oldRealtimeSetup, newRealtimeSetup);
  console.log('Successfully updated setupArenaRealtimeSync for dual real-time websockets (DB1 + DB2)');
} else {
  console.log('oldRealtimeSetup target not matched directly, checking normalized text');
}

// 3. Atualizar polling para 2500ms (2.5s) em vez de 4000ms
html = html.replace('}, 4000);', '}, 2500);');

fs.writeFileSync(adminPath, html, 'utf8');
console.log('public/admin.html updated successfully');
