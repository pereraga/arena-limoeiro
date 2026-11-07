const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '../public/admin.html');
let html = fs.readFileSync(adminPath, 'utf8');

// 1. UPDATE syncBookingToCloud
const syncStartMarker = "window.syncBookingToCloud = async function(booking, action = 'upsert') {";
const syncEndMarker = "window.pullDataFromCloudDatabases = async function() {";

const syncStartIndex = html.indexOf(syncStartMarker);
const syncEndIndex = html.indexOf(syncEndMarker, syncStartIndex);

if (syncStartIndex === -1 || syncEndIndex === -1) {
  console.error("Could not find syncBookingToCloud boundaries!");
  process.exit(1);
}

const newSyncCode = `window.syncBookingToCloud = async function(booking, action = 'upsert') {
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

    console.log('[ArenaCloud] Dual-Write agendamento:', action, payload.id, 'status:', payload.status);

    // 1. Gravação no Banco 2 (Ativo & Salvaguarda)
    try {
      if (action === 'delete') {
        fetch(ARENA_CLOUD_DBS.db2Url + '/rest/v1/bookings?id=eq.' + encodeURIComponent(payload.id), {
          method: 'DELETE',
          headers: { apikey: ARENA_CLOUD_DBS.db2Key, Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db2Key }
        }).catch(() => {});
      } else {
        // Envia PATCH direto para garantir persistência de alterações/cancelamento
        fetch(ARENA_CLOUD_DBS.db2Url + '/rest/v1/bookings?id=eq.' + encodeURIComponent(payload.id), {
          method: 'PATCH',
          headers: {
            apikey: ARENA_CLOUD_DBS.db2Key,
            Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db2Key,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }).catch(() => {});

        // Envia também POST com merge-duplicates caso o registro seja novo
        fetch(ARENA_CLOUD_DBS.db2Url + '/rest/v1/bookings', {
          method: 'POST',
          headers: {
            apikey: ARENA_CLOUD_DBS.db2Key,
            Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db2Key,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates'
          },
          body: JSON.stringify(payload)
        }).catch(err => console.warn('[ArenaCloud] Aviso DB2:', err));
      }
    } catch(e) {}

    // 2. Gravação no Banco 1 (Principal)
    try {
      if (action === 'delete') {
        fetch(ARENA_CLOUD_DBS.db1Url + '/rest/v1/bookings?id=eq.' + encodeURIComponent(payload.id), {
          method: 'DELETE',
          headers: { apikey: ARENA_CLOUD_DBS.db1Key, Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db1Key }
        }).catch(() => {});
      } else {
        // PATCH no DB1
        fetch(ARENA_CLOUD_DBS.db1Url + '/rest/v1/bookings?id=eq.' + encodeURIComponent(payload.id), {
          method: 'PATCH',
          headers: {
            apikey: ARENA_CLOUD_DBS.db1Key,
            Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db1Key,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }).catch(() => {});

        // POST no DB1
        fetch(ARENA_CLOUD_DBS.db1Url + '/rest/v1/bookings', {
          method: 'POST',
          headers: {
            apikey: ARENA_CLOUD_DBS.db1Key,
            Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db1Key,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates'
          },
          body: JSON.stringify(payload)
        }).catch(() => {});
      }
    } catch(e) {}

    // 3. Sincronização Serverless Cloud (Notifica APKs e Celulares conectados)
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

    // 4. Broadcast local entre abas
    try {
      const bc = new BroadcastChannel('arena_limoeiro_sync');
      bc.postMessage({ type: 'booking_updated', action, payload });
    } catch(e) {}
  };

  // Puxa agendamentos e mensalistas dos Bancos de Dados na Nuvem
  `;

html = html.substring(0, syncStartIndex) + newSyncCode + html.substring(syncEndIndex);
console.log('1. Replaced syncBookingToCloud successfully!');

// 2. UPDATE pullDataFromCloudDatabases
const pullStartMarker = "window.pullDataFromCloudDatabases = async function() {";
const pullEndMarker = "// 2. Carrega mensalistas do Banco 2";

const pullStartIndex = html.indexOf(pullStartMarker);
const pullEndIndex = html.indexOf(pullEndMarker, pullStartIndex);

if (pullStartIndex === -1 || pullEndIndex === -1) {
  console.error("Could not find pullDataFromCloudDatabases boundaries!");
  process.exit(1);
}

const newPullCode = `window.pullDataFromCloudDatabases = async function() {
    try {
      console.log('[ArenaCloud] Puxando dados dos 2 Bancos de Dados...');
      let cloudBookings = null;
      let cloudMembers = null;

      // 1. Tenta carregar reservas do DB2 (Banco 2 Ativo)
      try {
        const res2 = await fetch(ARENA_CLOUD_DBS.db2Url + '/rest/v1/bookings?select=*&order=date.asc', {
          headers: { apikey: ARENA_CLOUD_DBS.db2Key, Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db2Key }
        });
        if (res2.ok) {
          cloudBookings = await res2.json();
          console.log('[ArenaCloud] Carregados ' + cloudBookings.length + ' agendamentos do Banco 2.');
        }
      } catch(e2) {
        console.warn('[ArenaCloud] Falha no Banco 2, tentando Banco 1:', e2);
      }

      // Se falhou no DB2, tenta DB1 como fallback
      if (!cloudBookings || cloudBookings.length === 0) {
        try {
          const res1 = await fetch(ARENA_CLOUD_DBS.db1Url + '/rest/v1/bookings?select=*&order=date.asc', {
            headers: { apikey: ARENA_CLOUD_DBS.db1Key, Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db1Key }
          });
          if (res1.ok) {
            cloudBookings = await res1.json();
            console.log('[ArenaCloud] Carregados ' + cloudBookings.length + ' agendamentos do Banco 1.');
          }
        } catch(e1) {}
      }

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

          // Se a reserva foi excluída pelo admin, ignora qualquer retorno defasado da nuvem
          if (deletedIds.has(idStr)) {
            return;
          }

          const cId = (typeof getCourtById === 'function') ? getCourtById(cb.court_id || cb.courtId).id : (cb.court_id || '');
          const slotKey = cb.date + '_' + cId + '_' + cb.start_time;
          const existing = bMap.get(idStr);

          // PROTEÇÃO DEFINITIVA CONTRA RESSUSCITAÇÃO DE RESERVA CANCELADA OU FINALIZADA
          let finalStatus = cb.status || 'confirmed';
          if (existing) {
            if (existing.status === 'cancelled') {
              finalStatus = 'cancelled';
              // Garante que o banco também esteja atualizado
              if (cb.status !== 'cancelled' && typeof window.syncBookingToCloud === 'function') {
                window.syncBookingToCloud(existing, 'upsert');
              }
            } else if (existing.status === 'finished' || finishedSlots.has(slotKey)) {
              finalStatus = 'finished';
            } else if (existing.status === 'in_progress' || existing.status === 'live') {
              finalStatus = existing.status;
            } else if (existing.status === 'pending') {
              // preserva status local
              finalStatus = existing.status;
            }
            // Preserva também edições locais de data, hora e quadra se foram alteradas
            bMap.set(idStr, { ...cb, ...existing, status: finalStatus });
          } else {
            if (finishedSlots.has(slotKey)) {
              cb.status = 'finished';
            }
            bMap.set(idStr, cb);
          }
        });

        window.adminGameState.bookings = Array.from(bMap.values());
        try {
          localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));
        } catch(e) {}
      }

      `;

html = html.substring(0, pullStartIndex) + newPullCode + html.substring(pullEndIndex);
console.log('2. Replaced pullDataFromCloudDatabases successfully!');

// 3. UPDATE cancelGame and applyNoShow in the code
// First let's check cancelGame occurrences
const cancelGameFunc = `window.cancelGame = function(id) {
    if (!confirm('Deseja realmente cancelar esta partida? O cancelamento ficará registrado no histórico.')) return;
    const g = getGame(id);
    if (!g) return;

    g.status = 'cancelled';
    g.attendance = 'Cancelada';
    addMatchLog(g, 'Partida cancelada', 'Cancelamento manual registrado pela administração.');
    saveAdminGameState();

    // ☁️ Persistência imediata nos bancos de dados para que a nuvem nunca reverta
    if (typeof window.syncBookingToCloud === 'function') {
      window.syncBookingToCloud(g, 'upsert');
    }

    renderMovementMatches();
    renderCadastrosBookingsList();
    arenaToast('Partida cancelada com sucesso!');
  };`;

// Replace first cancelGame
const cancel1Str = `  window.cancelGame = function(id) {
    if (!confirm('Deseja cancelar esta reserva? Ela continuará registrada no histórico do dia.')) return;
    const g = getGame(id);
    if (!g) return;
    g.status = 'cancelled';
    addMatchLog(g, 'Reserva cancelada', 'Cancelamento manual registrado pela administração.');
    saveAdminGameState();
    arenaToast('Partida cancelada.');
  };`;

if (html.includes(cancel1Str)) {
  html = html.replace(cancel1Str, cancelGameFunc);
  console.log('3. Replaced first cancelGame!');
}

// Replace second cancelGame
const cancel2Str = `  window.cancelGame = function(id) {
    if (!confirm('Deseja realmente cancelar esta partida? O cancelamento ficará registrado no histórico.')) return;
    const g = getGame(id);
    if (!g) return;

    g.status = 'cancelled';
    g.attendance = 'Cancelada';
    addMatchLog(g, 'Partida cancelada', 'Cancelamento manual registrado pela administração.');
    saveAdminGameState();
    renderMovementMatches();
    renderCadastrosBookingsList();
    arenaToast('Partida cancelada com sucesso.');
  };`;

if (html.includes(cancel2Str)) {
  html = html.replace(cancel2Str, cancelGameFunc);
  console.log('4. Replaced second cancelGame!');
}

// 4. UPDATE applyNoShow to sync status = 'cancelled' to cloud
const oldNoShow = `    saveAdminGameState();
    closeArenaModal('arenaNoShowModal');
    renderMovementMatches();
    renderCadastrosBookingsList();
    arenaToast('Falta registrada no histórico da partida.');`;

const newNoShow = `    saveAdminGameState();
    if (typeof window.syncBookingToCloud === 'function') {
      window.syncBookingToCloud(g, 'upsert');
    }
    closeArenaModal('arenaNoShowModal');
    renderMovementMatches();
    renderCadastrosBookingsList();
    arenaToast('Falta registrada no histórico da partida.');`;

if (html.includes(oldNoShow)) {
  html = html.replace(oldNoShow, newNoShow);
  console.log('5. Replaced applyNoShow sync!');
}

// 5. UPDATE saveEditGame to sync changes to cloud in the modal
const oldSaveEditEnd = `    saveAdminGameState();
    closeArenaModal('arenaEditModal');
    renderMovementMatches();
    renderCadastrosBookingsList();
    arenaToast('Partida atualizada com sucesso!');`;

const newSaveEditEnd = `    saveAdminGameState();
    // ☁️ Envia a edição imediatamente para os Bancos de Dados na Nuvem (Dual-Write)
    if (typeof window.syncBookingToCloud === 'function') {
      window.syncBookingToCloud(g, 'upsert');
    }
    closeArenaModal('arenaEditModal');
    renderMovementMatches();
    renderCadastrosBookingsList();
    arenaToast('Partida atualizada com sucesso!');`;

if (html.includes(oldSaveEditEnd)) {
  html = html.replace(oldSaveEditEnd, newSaveEditEnd);
  console.log('6. Replaced saveEditGame sync!');
}

// 6. UPDATE deleteMatchPrompt to call syncBookingToCloud(..., 'delete')
const oldDelMatch = `window.deleteMatchPrompt = function(id) {
    if (!confirm('Deseja realmente cancelar e liberar o horário deste agendamento?')) return;
    window.adminGameState.bookings = window.adminGameState.bookings.filter(b => String(b.id) !== String(id));
    localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));
    if (typeof window.renderMovementMatches === "function") window.renderMovementMatches();
    if (typeof window.renderCadastrosBookingsList === "function") window.renderCadastrosBookingsList();
    alert('Horário liberado com sucesso!');
  };`;

const newDelMatch = `window.deleteMatchPrompt = function(id) {
    if (!confirm('Deseja realmente cancelar e liberar o horário deste agendamento?')) return;
    const bookingToDelete = (window.adminGameState.bookings || []).find(b => String(b.id) === String(id)) || { id: id };
    window.adminGameState.bookings = window.adminGameState.bookings.filter(b => String(b.id) !== String(id));
    localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));

    // ☁️ Deleta imediatamente de ambos os bancos na nuvem e registra imunidade
    if (typeof window.syncBookingToCloud === 'function') {
      window.syncBookingToCloud(bookingToDelete, 'delete');
    }

    if (typeof window.renderMovementMatches === "function") window.renderMovementMatches();
    if (typeof window.renderCadastrosBookingsList === "function") window.renderCadastrosBookingsList();
    alert('Horário liberado com sucesso!');
  };`;

if (html.includes(oldDelMatch)) {
  html = html.replace(oldDelMatch, newDelMatch);
  console.log('7. Replaced deleteMatchPrompt sync!');
}

fs.writeFileSync(adminPath, html, 'utf8');
console.log('ALL FIXES WRITTEN TO public/admin.html SUCCESSFULLY!');
