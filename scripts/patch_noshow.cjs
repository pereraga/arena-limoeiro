const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '../public/admin.html');
let html = fs.readFileSync(adminPath, 'utf8');

// 1. Definição da nova função robusta openNoShow e applyNoShow
const robustNoShowCode = `
  // 3. Abrir Modal de Não Comparecimento / Falta
  window.openNoShow = function(id) {
    const g = (typeof getGame === 'function') ? getGame(id) : null;
    const match = g || (window.adminGameState.bookings || []).find(b => String(b.id) === String(id)) || {};

    const inputId = document.getElementById('noShowMatchId');
    if (inputId) inputId.value = id;

    const inputReason = document.getElementById('noShowReason');
    if (inputReason) inputReason.value = '';

    const inputReasonAlt = document.getElementById('noShowReasonInput');
    if (inputReasonAlt) inputReasonAlt.value = '';

    const modal = document.getElementById('arenaNoShowModal');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.remove('hidden');
    }
    if (window.lucide) lucide.createIcons();
  };

  // Confirmar Falta / Não Compareceu: Faz o jogo sumir completamente do banco de dados (DB1 e DB2)
  window.applyNoShow = async function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const id = document.getElementById('noShowMatchId')?.value;
    if (!id) {
      closeArenaModal('arenaNoShowModal');
      return;
    }

    const reason = (document.getElementById('noShowReason')?.value || document.getElementById('noShowReasonInput')?.value || '').trim() || 'Responsável não compareceu';
    const isMonthly = String(id).startsWith('monthly-');
    const rawMonthlyId = String(id).replace('monthly-', '');
    const selDate = window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-17');

    const bookingToDelete = (window.adminGameState.bookings || []).find(b => String(b.id) === String(id) || (isMonthly && String(b.id) === rawMonthlyId)) || {
      id: id,
      date: selDate,
      observation: reason
    };

    // 1. Remove do estado operacional local
    window.adminGameState.bookings = (window.adminGameState.bookings || []).filter(b => String(b.id) !== String(id) && String(b.id) !== rawMonthlyId);
    if (isMonthly) {
      window.adminGameState.monthlyMembers = (window.adminGameState.monthlyMembers || []).filter(m => String(m.id) !== rawMonthlyId && String(m.id) !== String(id));
    }

    // 2. Registra na lista de exclusões do dia para evitar que reapareça em cache local
    try {
      let excluidosMap = {};
      const savedExcl = localStorage.getItem('arena_jogos_excluidos_v1');
      if (savedExcl) excluidosMap = JSON.parse(savedExcl);
      excluidosMap[id + '_' + selDate] = { id: id, date: selDate, at: new Date().toISOString() };
      if (isMonthly) {
        excluidosMap[rawMonthlyId + '_' + selDate] = { id: rawMonthlyId, date: selDate, at: new Date().toISOString() };
      }
      localStorage.setItem('arena_jogos_excluidos_v1', JSON.stringify(excluidosMap));
    } catch(err) {}

    // 3. Atualiza tela operacional IMEDIATAMENTE
    closeArenaModal('arenaNoShowModal');
    if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();
    if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();
    if (typeof window.updateMovementCalendarStrip === 'function') window.updateMovementCalendarStrip();
    if (typeof window.renderMovementCalendarStrip === 'function') window.renderMovementCalendarStrip();
    if (typeof window.renderCadastrosBookingsList === 'function') window.renderCadastrosBookingsList();

    if (typeof window.showArenaPopIt === 'function') {
      window.showArenaPopIt({
        title: '✓ Falta Registrada!',
        message: 'A partida foi removida do banco de dados e o horário foi liberado com sucesso.',
        duration: 20
      });
    } else if (typeof arenaToast === 'function') {
      arenaToast('✓ Ausência confirmada. O jogo foi excluído e sumiu do banco de dados!');
    }

    // 4. Executa EXCLUSÃO REAL E DEFINITIVA nos bancos na nuvem (DB2 e DB1) com marcadores de exclusão distribuídos (Tombstones)
    if (window.ARENA_CLOUD_DBS) {
      window.__arenaCloudTombstones = window.__arenaCloudTombstones || new Set();
      window.__arenaCloudTombstones.add(String(id));
      if (isMonthly) {
        window.__arenaCloudTombstones.add(rawMonthlyId);
        window.__arenaCloudMemberTombstones = window.__arenaCloudMemberTombstones || new Set();
        window.__arenaCloudMemberTombstones.add(rawMonthlyId);
      }

      const deleteDb = async (dbUrl, dbKey, table, qId) => {
        try {
          await fetch(dbUrl + '/rest/v1/' + table + '?id=eq.' + encodeURIComponent(qId), {
            method: 'DELETE',
            headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey, Prefer: 'return=minimal' }
          });
        } catch(e) {}
      };

      const sendTombstone = async (dbUrl, dbKey, deletedId, isMember) => {
        try {
          const tsItem = {
            id: 'tombstone-' + deletedId,
            court_id: 'court-beach-1',
            date: selDate,
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
            observation: 'TOMBSTONE:::' + (isMember ? 'member:::' : '') + JSON.stringify({ deletedId: deletedId, at: Date.now() })
          };
          await fetch(dbUrl + '/rest/v1/bookings', {
            method: 'POST',
            headers: {
              apikey: dbKey,
              Authorization: 'Bearer ' + dbKey,
              'Content-Type': 'application/json',
              Prefer: 'resolution=merge-duplicates,return=minimal'
            },
            body: JSON.stringify(tsItem)
          });
        } catch(e) {}
      };

      // Dispara exclusões no Supabase DB1 e DB2 em paralelo
      const tasks = [
        deleteDb(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key, 'bookings', id),
        deleteDb(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key, 'bookings', id),
        sendTombstone(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key, id, false),
        sendTombstone(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key, id, false)
      ];
      if (isMonthly) {
        tasks.push(
          deleteDb(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key, 'monthly_members', rawMonthlyId),
          deleteDb(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key, 'monthly_members', rawMonthlyId),
          deleteDb(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key, 'bookings', rawMonthlyId),
          deleteDb(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key, 'bookings', rawMonthlyId),
          sendTombstone(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key, rawMonthlyId, true),
          sendTombstone(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key, rawMonthlyId, true)
        );
      }
      try {
        await Promise.allSettled(tasks);
      } catch(e) {}

      // Sincroniza via endpoint serverless se disponível
      try {
        fetch(ARENA_CLOUD_DBS.syncEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete_booking', payload: bookingToDelete })
        }).catch(() => {});
      } catch(e) {}
    }

    // Broadcast local instantâneo entre abas
    try {
      const bc = new BroadcastChannel('arena_limoeiro_sync');
      bc.postMessage({ type: 'booking_updated', action: 'delete', payload: bookingToDelete });
    } catch(e) {}

    // Invalida assinaturas e força atualização rápida na nuvem
    window.__lastBookingsSig = null;
    window.__lastMembersSig = null;
    if (typeof window.pullDataFromCloudDatabases === 'function') {
      await window.pullDataFromCloudDatabases();
    }
  };
`;

// Substituir a primeira ocorrência por uma referência simples
const s1 = html.indexOf('window.openNoShow = function(id) {');
const e1 = html.indexOf('window.calcDelayFromArrival =', s1);
if (s1 !== -1 && e1 !== -1) {
  html = html.substring(0, s1) + '// openNoShow e applyNoShow definidos na seção principal abaixo\n\n  ' + html.substring(e1);
}

// Substituir a segunda ocorrência pela versão robusta completa
const s2 = html.indexOf('window.openNoShow = function(id) {');
const e2 = html.indexOf('window.duplicateGame =', s2);
if (s2 !== -1 && e2 !== -1) {
  html = html.substring(0, s2) + robustNoShowCode + '\n  ' + html.substring(e2);
}

fs.writeFileSync(adminPath, html, 'utf8');
console.log('Successfully patched openNoShow and applyNoShow in public/admin.html');
