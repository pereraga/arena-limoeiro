const fs = require('fs');
const path = require('path');
const vm = require('vm');

const filePath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('[Opt] Starting performance optimization on admin.html...');

// 1. Optimize syncBookingToCloud (non-blocking background dual-write, single upsert with resolution=merge-duplicates,return=minimal)
const oldSyncStart = `  // Toda e qualquer atualização no sistema é enviada em Dual-Write para ambos os bancos\n  window.syncBookingToCloud = async function(booking, action = 'upsert') {`;
const oldSyncEnd = `    // 4. Broadcast local entre abas\n    try {\n      const bc = new BroadcastChannel('arena_limoeiro_sync');\n      bc.postMessage({ type: 'booking_updated', action, payload });\n    } catch(e) {}\n  };`;

const newSyncCode = `  // Toda e qualquer atualização no sistema é enviada em Dual-Write para ambos os bancos (Otimizado de alta performance)
  window.syncBookingToCloud = function(booking, action = 'upsert') {
    if (!booking || !booking.id) return;

    // Se for delete, registra na lista de excluídos para imunidade contra ressuscitação
    if (action === 'delete') {
      try {
        const delList = JSON.parse(localStorage.getItem('arena_deleted_bookings') || '[]');
        if (!delList.includes(String(booking.id))) {
          delList.push(String(booking.id));
          localStorage.setItem('arena_deleted_bookings', JSON.stringify(delList));
        }
      } catch(e) {}
    }

    const payload = {
      id: String(booking.id),
      court_id: booking.court_id || booking.courtId || 'court-society-1',
      customer_id: booking.customer_id || null,
      date: booking.date || window.adminGameState.selectedDate || '2026-11-03',
      start_time: booking.start_time || (booking.time ? booking.time.split(' ')[0] : '16:00'),
      end_time: booking.end_time || (booking.time && booking.time.includes('às') ? booking.time.split('às')[1].trim() : '17:00'),
      time: booking.time || ((booking.start_time || '16:00') + ' às ' + (booking.end_time || '17:00')),
      duration: Number(booking.duration) || 60,
      customer_name: booking.customer_name || booking.name || 'Cliente Arena',
      customer_phone: booking.customer_phone || booking.phone || '(81) 99556-2693',
      total_price: Number(booking.total_price || booking.price || 100),
      status: booking.status || 'confirmed',
      booking_type: booking.booking_type || 'avulso',
      payment_method: booking.payment_method || booking.payment || 'pix',
      product_cart: (typeof booking.product_cart === 'object' && booking.product_cart !== null) ? booking.product_cart : {},
      observation: booking.observation || booking.finishObs || null
    };

    console.log('[ArenaCloud] Dual-Write ágil:', action, payload.id, 'status:', payload.status);

    // Execução assíncrona em background para NUNCA travar a interface do usuário ou resposta de botões
    setTimeout(async () => {
      const writeCloud = async (dbUrl, dbKey) => {
        try {
          if (action === 'delete') {
            await fetch(dbUrl + '/rest/v1/bookings?id=eq.' + encodeURIComponent(payload.id), {
              method: 'DELETE',
              headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey, Prefer: 'return=minimal' }
            });
          } else {
            // Upsert atômico em 1 requisição com preferência merge-duplicates
            const res = await fetch(dbUrl + '/rest/v1/bookings', {
              method: 'POST',
              headers: {
                apikey: dbKey,
                Authorization: 'Bearer ' + dbKey,
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates,return=minimal'
              },
              body: JSON.stringify(payload)
            });
            if (!res.ok) {
              await fetch(dbUrl + '/rest/v1/bookings?id=eq.' + encodeURIComponent(payload.id), {
                method: 'PATCH',
                headers: {
                  apikey: dbKey,
                  Authorization: 'Bearer ' + dbKey,
                  'Content-Type': 'application/json',
                  Prefer: 'return=minimal'
                },
                body: JSON.stringify(payload)
              });
            }
          }
        } catch(e) {}
      };

      // Dispara DB2 e DB1 em paralelo sem bloquear a UI
      await Promise.allSettled([
        writeCloud(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key),
        writeCloud(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key)
      ]);

      // Notificação serverless
      try {
        if (window.ArenaCloudSync && typeof window.ArenaCloudSync.push === 'function') {
          window.ArenaCloudSync.push(action === 'delete' ? 'delete_booking' : 'push_booking', payload).catch(() => {});
        } else {
          fetch(ARENA_CLOUD_DBS.syncEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: action === 'delete' ? 'delete_booking' : 'push_booking', payload })
          }).catch(() => {});
        }
      } catch(e) {}
    }, 0);

    // Broadcast local instantâneo entre abas
    try {
      const bc = new BroadcastChannel('arena_limoeiro_sync');
      bc.postMessage({ type: 'booking_updated', action, payload });
    } catch(e) {}
  };`;

const syncStartIdx = content.indexOf(oldSyncStart);
const syncEndIdx = content.indexOf(oldSyncEnd);

if (syncStartIdx !== -1 && syncEndIdx !== -1) {
  const syncFullOld = content.substring(syncStartIdx, syncEndIdx + oldSyncEnd.length);
  content = content.replace(syncFullOld, newSyncCode);
  console.log('[Opt] 1. syncBookingToCloud optimized successfully!');
} else {
  console.error('[Opt] ERROR: syncBookingToCloud not found!');
  process.exit(1);
}

// 2. Optimize pullDataFromCloudDatabases
const oldPullStart = `  // Puxa agendamentos e mensalistas dos Bancos de Dados na Nuvem\n  window.pullDataFromCloudDatabases = async function() {`;
const oldPullEnd = `      if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();\n      if (typeof window.renderCadastrosBookingsList === 'function') window.renderCadastrosBookingsList();\n    } catch(err) {\n      console.warn('[ArenaCloud] Erro geral na sincronização inicial:', err);\n    }\n  };`;

const newPullCode = `  // Puxa agendamentos e mensalistas dos Bancos de Dados na Nuvem (Otimizado: paralelo, com debounce e detecção de mudanças)
  window.pullDataFromCloudDatabases = async function() {
    // Evita sobreposição de puxadas simultâneas
    if (window.__pullInProgress) return;
    const nowTs = Date.now();
    if (window.__lastPullSuccessTs && (nowTs - window.__lastPullSuccessTs < 3000)) {
      return; // Debounce de 3s para evitar requisições redundantes
    }
    window.__pullInProgress = true;

    // Executa expurgo diário preventivo antes de puxar dados (libera espaço e evita baixar registros mortos)
    try {
      const todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '';
      if (todayStr && window.__lastPurgeExecutionDate !== todayStr && typeof window.purgeExpiredCloudBookings === 'function') {
        await window.purgeExpiredCloudBookings();
      }
    } catch(pErr) {}

    try {
      const fetchFast = async (url, key) => {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 4500);
        try {
          const res = await fetch(url, {
            headers: { apikey: key, Authorization: 'Bearer ' + key, 'Accept': 'application/json' },
            signal: ctrl.signal
          });
          clearTimeout(timer);
          if (res.ok) return await res.json();
        } catch(e) {
          clearTimeout(timer);
        }
        return null;
      };

      // 1. Concorrência competitiva paralela: DB2 e DB1 buscam ao mesmo tempo; o primeiro a responder é adotado
      const bookingsPromise = Promise.any([
        fetchFast(ARENA_CLOUD_DBS.db2Url + '/rest/v1/bookings?select=*&order=date.asc', ARENA_CLOUD_DBS.db2Key).then(r => (Array.isArray(r) && r.length > 0) ? r : Promise.reject()),
        fetchFast(ARENA_CLOUD_DBS.db1Url + '/rest/v1/bookings?select=*&order=date.asc', ARENA_CLOUD_DBS.db1Key).then(r => (Array.isArray(r) && r.length > 0) ? r : Promise.reject())
      ]).catch(() => null);

      // 2. Concorrência de mensalistas em paralelo
      const membersPromise = Promise.any([
        fetchFast(ARENA_CLOUD_DBS.db2Url + '/rest/v1/monthly_members?select=*&order=day_of_week.asc', ARENA_CLOUD_DBS.db2Key).then(r => (Array.isArray(r) && r.length > 0) ? r : Promise.reject()),
        fetchFast(ARENA_CLOUD_DBS.db1Url + '/rest/v1/monthly_members?select=*&order=day_of_week.asc', ARENA_CLOUD_DBS.db1Key).then(r => (Array.isArray(r) && r.length > 0) ? r : Promise.reject())
      ]).catch(() => null);

      const [cloudBookings, cloudMembers] = await Promise.all([bookingsPromise, membersPromise]);
      let stateChanged = false;

      // Mescla reservas com o estado operacional respeitando alterações e cancelamentos locais
      if (Array.isArray(cloudBookings) && cloudBookings.length > 0) {
        const bMap = new Map();
        (window.adminGameState.bookings || []).forEach(b => {
          if (b && b.id) bMap.set(String(b.id), b);
        });

        // Carrega lista de IDs cancelados e deletados para não permitir reversão
        let deletedIds = new Set();
        try {
          const storedDel = JSON.parse(localStorage.getItem('arena_deleted_bookings') || '[]');
          if (Array.isArray(storedDel)) deletedIds = new Set(storedDel.map(String));
        } catch(e) {}

        const finishedSlots = new Set();
        (window.adminGameState.bookings || []).forEach(b => {
          if (b && b.status === 'finished') {
            const cId = (typeof getCourtById === 'function') ? getCourtById(b.court_id || b.courtId).id : (b.court_id || '');
            finishedSlots.add(b.date + '_' + cId + '_' + b.start_time);
          }
        });

        cloudBookings.forEach(cb => {
          if (!cb || !cb.id) return;
          const idStr = String(cb.id);

          if (deletedIds.has(idStr)) return;

          const cId = (typeof getCourtById === 'function') ? getCourtById(cb.court_id || cb.courtId).id : (cb.court_id || '');
          const slotKey = cb.date + '_' + cId + '_' + cb.start_time;
          const existing = bMap.get(idStr);

          let finalStatus = cb.status || 'confirmed';
          if (existing) {
            if (existing.status === 'cancelled') {
              finalStatus = 'cancelled';
              if (cb.status !== 'cancelled' && typeof window.syncBookingToCloud === 'function') {
                window.syncBookingToCloud(existing, 'upsert');
              }
            } else if (existing.status === 'finished' || finishedSlots.has(slotKey)) {
              finalStatus = 'finished';
            } else if (existing.status === 'in_progress' || existing.status === 'live') {
              finalStatus = existing.status;
            } else if (existing.status === 'pending') {
              finalStatus = existing.status;
            }
            bMap.set(idStr, { ...cb, ...existing, status: finalStatus });
          } else {
            if (finishedSlots.has(slotKey)) {
              cb.status = 'finished';
            }
            bMap.set(idStr, cb);
            stateChanged = true;
          }
        });

        const newBookings = Array.from(bMap.values());
        const newSig = newBookings.length + '_' + newBookings.slice(0, 15).map(b => b.id + ':' + b.status + ':' + (b.payment_status || '') + ':' + (b.attendance || '')).join('|');
        if (newSig !== window.__lastBookingsSig) {
          window.__lastBookingsSig = newSig;
          stateChanged = true;
          window.adminGameState.bookings = newBookings;
          try {
            localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));
          } catch(e) {}
        }
      }

      // 2. Atualiza mensalistas
      if (Array.isArray(cloudMembers) && cloudMembers.length > 0) {
        const memSig = cloudMembers.length + '_' + cloudMembers.map(m => m.id).join(',');
        if (memSig !== window.__lastMembersSig) {
          window.__lastMembersSig = memSig;
          stateChanged = true;
          window.adminGameState.monthlyMembers = cloudMembers;
          try {
            localStorage.setItem('arena_monthly_members', JSON.stringify(cloudMembers));
          } catch(e) {}
        }
      }

      window.__lastPullSuccessTs = Date.now();

      // Só re-renderiza se houve alteração REAL nos dados!
      if (stateChanged) {
        if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();
        if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();
        if (typeof window.renderCadastrosBookingsList === 'function') window.renderCadastrosBookingsList();
      }
    } catch(err) {
      console.warn('[ArenaCloud] Erro geral na sincronização rápida:', err);
    } finally {
      window.__pullInProgress = false;
    }
  };`;

const pullStartIdx = content.indexOf(oldPullStart);
const pullEndIdx = content.indexOf(oldPullEnd);

if (pullStartIdx !== -1 && pullEndIdx !== -1) {
  const pullFullOld = content.substring(pullStartIdx, pullEndIdx + oldPullEnd.length);
  content = content.replace(pullFullOld, newPullCode);
  console.log('[Opt] 2. pullDataFromCloudDatabases optimized successfully!');
} else {
  console.error('[Opt] ERROR: pullDataFromCloudDatabases not found!');
  process.exit(1);
}

// 3. Optimize getMatchesForDate with caching
const oldGetMatchesStart = `  function getMatchesForDate(dateStr) {\n    if (!dateStr) dateStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-04';`;
const newGetMatchesStart = `  function getMatchesForDate(dateStr) {
    if (!dateStr) dateStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-04';
    if (!window.__matchesCacheByDate) window.__matchesCacheByDate = new Map();
    if (window.__matchesCacheByDate.has(dateStr)) {
      return window.__matchesCacheByDate.get(dateStr);
    }`;

const oldGetMatchesEnd = `    matches.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));\n    return matches;\n  }\n  window.getMatchesForDate = getMatchesForDate;`;
const newGetMatchesEnd = `    matches.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    if (!window.__matchesCacheByDate) window.__matchesCacheByDate = new Map();
    window.__matchesCacheByDate.set(dateStr, matches);
    return matches;
  }
  window.getMatchesForDate = getMatchesForDate;`;

if (content.includes(oldGetMatchesStart) && content.includes(oldGetMatchesEnd)) {
  content = content.replace(oldGetMatchesStart, newGetMatchesStart);
  content = content.replace(oldGetMatchesEnd, newGetMatchesEnd);
  console.log('[Opt] 3. getMatchesForDate cache implemented successfully!');
} else {
  console.error('[Opt] ERROR: getMatchesForDate signatures not found!');
  process.exit(1);
}

// 4. Optimize saveAdminGameState (remove blocking pullDataFromCloudDatabases and clear cache)
const oldSaveState = `  // Salva no storage e atualiza ambas as listas
  window.saveAdminGameState = function() {
    try {
      localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));
      localStorage.setItem('arena-limoeiro-games-prototype-v2', JSON.stringify(window.adminGameState.bookings));
    } catch(e) {}
    if (typeof window.renderMovementMatches === "function") window.renderMovementMatches();
    // ☁️ Puxa dados atualizados dos 2 Bancos de Dados na nuvem imediatamente
    if (typeof window.pullDataFromCloudDatabases === "function") {
      window.pullDataFromCloudDatabases();
    }
    if (typeof window.renderCadastrosBookingsList === "function") window.renderCadastrosBookingsList();
  };`;

const newSaveState = `  // Salva no storage e atualiza ambas as listas de forma instantânea e fluida
  window.saveAdminGameState = function() {
    try {
      localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));
      localStorage.setItem('arena-limoeiro-games-prototype-v2', JSON.stringify(window.adminGameState.bookings));
    } catch(e) {}
    if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();
    if (typeof window.renderMovementMatches === "function") window.renderMovementMatches();
    if (typeof window.renderCadastrosBookingsList === "function") window.renderCadastrosBookingsList();
  };`;

if (content.includes(oldSaveState)) {
  content = content.replace(oldSaveState, newSaveState);
  console.log('[Opt] 4. saveAdminGameState decoupled from blocking cloud pull!');
} else {
  console.error('[Opt] ERROR: saveAdminGameState pattern not found!');
  process.exit(1);
}

// 5. Optimize handleGameMainAction (remove duplicate renderMovementMatches)
const oldHandleAction = `      if (typeof window.saveAdminGameState === 'function') window.saveAdminGameState();
      if (typeof window.syncBookingToCloud === 'function') window.syncBookingToCloud(g, 'upsert');
      if (typeof window.showNotification === 'function') {
        window.showNotification("Partida iniciada! O botão mudou para 'Finalizar'.");
      }

      if (typeof window.renderMovementMatches === 'function') {
        window.renderMovementMatches();
      }`;

const newHandleAction = `      if (typeof window.saveAdminGameState === 'function') window.saveAdminGameState();
      if (typeof window.syncBookingToCloud === 'function') window.syncBookingToCloud(g, 'upsert');
      if (typeof window.showNotification === 'function') {
        window.showNotification("Partida iniciada! O botão mudou para 'Finalizar'.");
      }`;

if (content.includes(oldHandleAction)) {
  content = content.replace(oldHandleAction, newHandleAction);
  console.log('[Opt] 5. handleGameMainAction streamlined!');
} else {
  console.error('[Opt] ERROR: handleGameMainAction pattern not found!');
  process.exit(1);
}

// 6. Optimize polling interval: 12000ms instead of 7000ms
const oldInterval = `    }, 7000);`;
const newInterval = `    }, 12000);`;

if (content.includes(oldInterval)) {
  content = content.replace(oldInterval, newInterval);
  console.log('[Opt] 6. Background polling loop relaxed to 12s!');
} else {
  console.warn('[Opt] Warning: 7000ms interval not found directly, searching regex...');
  content = content.replace(/window\.__arenaFeedAutoInterval\s*=\s*setInterval\(\(\)\s*=>\s*\{([\s\S]*?)\},\s*7000\);/, (m, p1) => {
    return `window.__arenaFeedAutoInterval = setInterval(() => {${p1}}, 12000);`;
  });
}

// Write back to public/admin.html
fs.writeFileSync(filePath, content, 'utf8');
console.log('[Opt] Optimization applied to public/admin.html. Validating syntax...');

// Validate JS syntax of all <script> blocks
const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(content)) !== null) {
  count++;
  const js = match[1];
  try {
    new vm.Script(js);
  } catch (err) {
    console.error(`Syntax error in <script> block ${count}:`, err.message);
    process.exit(1);
  }
}

console.log(`[Opt] ALL ${count} <script> blocks validated with ZERO syntax errors! SUCCESS!`);
