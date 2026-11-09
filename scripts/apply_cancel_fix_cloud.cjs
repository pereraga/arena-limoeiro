const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

// Replace the entire cancelGame implementation with robust await, status=cancelled patch + hard delete, cache invalidation, strip updates and Pop-it notification
const oldCancelGameStart = `// 5. Cancelar Partida
const cancelGame = window.cancelGame = async function(id, evt) {
    if (evt && evt.stopPropagation) evt.stopPropagation();
    let g = (typeof getGame === 'function') ? getGame(id) : null;
    if (!g) {
      g = (window.adminGameState.bookings || []).find(b => String(b.id) === String(id));
    }
    const nomeCliente = (g && (g.customer_name || g.name)) ? (g.customer_name || g.name) : 'esta partida';
    const confirmado = await window.mostrarConfirmacaoArena({
      titulo: 'Excluir / Cancelar Partida',
      mensagem: \`Deseja realmente excluir permanentemente a partida de <strong class="text-slate-900">"\${nomeCliente}"</strong> e remover este agendamento do banco de dados?\`,
      tipo: 'danger',
      textoConfirmar: 'Sim, Excluir Partida',
      textoCancelar: 'Manter'
    });
    if (!confirmado) return;

    const targetId = String(id);
    const selDate = (g && g.date) ? g.date : (window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-09'));

    // 1. Registrar na lista de jogos excluídos do dia para impedir que reapareça
    try {
      let excluidosMap = {};
      const savedExcl = localStorage.getItem('arena_jogos_excluidos_v1');
      if (savedExcl) excluidosMap = JSON.parse(savedExcl);
      const exKey = targetId + '_' + selDate;
      excluidosMap[exKey] = { id: targetId, date: selDate, at: new Date().toISOString() };
      localStorage.setItem('arena_jogos_excluidos_v1', JSON.stringify(excluidosMap));
    } catch(e) {}

    // 2. Remover da memória local de bookings
    window.adminGameState.bookings = (window.adminGameState.bookings || []).filter(b => String(b.id) !== targetId);

    // 2.1 Se for um jogo de mensalista (monthly-*), remover do estado em memória e desativar/excluir o contrato
    if (targetId.startsWith('monthly-')) {
      const rawMId = targetId.replace('monthly-', '');
      window.adminGameState.monthlyMembers = (window.adminGameState.monthlyMembers || []).filter(m => String(m.id) !== rawMId);
      
      const deleteMonthlyCloud = async (dbUrl, dbKey) => {
        try {
          await fetch(dbUrl + '/rest/v1/monthly_members?id=eq.' + encodeURIComponent(rawMId), {
            method: 'DELETE',
            headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey, Prefer: 'return=minimal' }
          });
        } catch(e) {}
      };
      if (window.ARENA_CLOUD_DBS) {
        Promise.allSettled([
          deleteMonthlyCloud(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key),
          deleteMonthlyCloud(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key)
        ]);
      }
    }

    // 3. Excluir dos Bancos de Dados Supabase DB1 e DB2
    const deleteFromCloud = async (dbUrl, dbKey) => {
      try {
        await fetch(dbUrl + '/rest/v1/bookings?id=eq.' + encodeURIComponent(targetId), {
          method: 'DELETE',
          headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey, Prefer: 'return=minimal' }
        });
        if (targetId.startsWith('monthly-')) {
          const rawMId = targetId.replace('monthly-', '');
          await fetch(dbUrl + '/rest/v1/bookings?id=eq.' + encodeURIComponent(rawMId), {
            method: 'DELETE',
            headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey, Prefer: 'return=minimal' }
          });
        }
      } catch(err) {
        console.warn('[ArenaCloud] Erro ao excluir agendamento:', err);
      }
    };

    if (window.ARENA_CLOUD_DBS) {
      Promise.allSettled([
        deleteFromCloud(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key),
        deleteFromCloud(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key)
      ]);
    }

    // 4. Limpar caches de partidas
    if (window.__matchesCacheByDate) {
      window.__matchesCacheByDate.clear();
    }
    if (typeof saveAdminGameState === 'function') saveAdminGameState();

    // 5. Atualizar imediatamente a tela operacional
    if (typeof renderMovementMatches === 'function') renderMovementMatches();
    if (typeof renderCadastrosBookingsList === 'function') renderCadastrosBookingsList();
    if (typeof updateCalendarBadges === 'function') updateCalendarBadges();
    if (typeof arenaToast === 'function') {
      arenaToast('✓ Partida excluída com sucesso do banco de dados!');
    }
  };`;

const newCancelGame = `// 5. Cancelar e Excluir Partida com Sincronização em Tempo Real na Nuvem
const cancelGame = window.cancelGame = async function(id, evt) {
    if (evt && evt.stopPropagation) evt.stopPropagation();
    let g = (typeof getGame === 'function') ? getGame(id) : null;
    if (!g) {
      g = (window.adminGameState.bookings || []).find(b => String(b.id) === String(id));
    }
    const isMonthly = String(id).startsWith('monthly-') || (g && (g.isMensalista || g.booking_type === 'mensalista'));
    const rawMonthlyId = String(id).replace('monthly-', '');
    const nomeCliente = (g && (g.customer_name || g.name)) ? (g.customer_name || g.name) : 'esta partida';

    const confirmado = await window.mostrarConfirmacaoArena({
      titulo: isMonthly ? 'Excluir Mensalista / Partida' : 'Excluir Partida',
      mensagem: \`Deseja realmente excluir permanentemente a partida de <strong class="text-slate-900">"\${nomeCliente}"</strong> e remover este agendamento do banco de dados?\`,
      tipo: 'danger',
      textoConfirmar: 'Sim, Excluir Agora',
      textoCancelar: 'Manter'
    });
    if (!confirmado) return;

    const targetId = String(id);
    const selDate = (g && g.date) ? g.date : (window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-09'));

    // 1. Remove do estado operacional da memória
    window.adminGameState.bookings = (window.adminGameState.bookings || []).filter(b => String(b.id) !== targetId && String(b.id) !== rawMonthlyId);
    if (isMonthly) {
      window.adminGameState.monthlyMembers = (window.adminGameState.monthlyMembers || []).filter(m => String(m.id) !== rawMonthlyId && String(m.id) !== targetId);
    }

    // 2. Registra na lista de exclusões do dia para evitar que reapareça em cache
    try {
      let excluidosMap = {};
      const savedExcl = localStorage.getItem('arena_jogos_excluidos_v1');
      if (savedExcl) excluidosMap = JSON.parse(savedExcl);
      excluidosMap[targetId + '_' + selDate] = { id: targetId, date: selDate, at: new Date().toISOString() };
      if (isMonthly) {
        excluidosMap[rawMonthlyId + '_' + selDate] = { id: rawMonthlyId, date: selDate, at: new Date().toISOString() };
      }
      localStorage.setItem('arena_jogos_excluidos_v1', JSON.stringify(excluidosMap));
    } catch(e) {}

    // 3. Atualiza tela operacional IMEDIATAMENTE para quem clicou
    if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();
    if (typeof renderMovementMatches === 'function') renderMovementMatches();
    if (typeof window.updateMovementCalendarStrip === 'function') window.updateMovementCalendarStrip();
    if (typeof window.renderMovementCalendarStrip === 'function') window.renderMovementCalendarStrip();
    if (typeof renderCadastrosBookingsList === 'function') renderCadastrosBookingsList();

    // 4. Executa EXCLUSÃO REAL E DEFINITIVA nos bancos na nuvem (DB2 e DB1)
    if (window.ARENA_CLOUD_DBS) {
      const deleteDb = async (dbUrl, dbKey, table, qId) => {
        try {
          await fetch(dbUrl + '/rest/v1/' + table + '?id=eq.' + encodeURIComponent(qId), {
            method: 'DELETE',
            headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey, Prefer: 'return=minimal' }
          });
        } catch(e) {}
      };

      // Exclui em bookings e em monthly_members
      const tasks = [
        deleteDb(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key, 'bookings', targetId),
        deleteDb(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key, 'bookings', targetId)
      ];
      if (isMonthly) {
        tasks.push(
          deleteDb(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key, 'monthly_members', rawMonthlyId),
          deleteDb(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key, 'monthly_members', rawMonthlyId),
          deleteDb(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key, 'bookings', rawMonthlyId),
          deleteDb(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key, 'bookings', rawMonthlyId)
        );
      }
      await Promise.allSettled(tasks);
    }

    // 5. Invalida assinaturas e força atualização imediata na nuvem
    window.__lastBookingsSig = null;
    window.__lastMembersSig = null;
    if (typeof window.pullDataFromCloudDatabases === 'function') {
      await window.pullDataFromCloudDatabases();
    }

    // 6. Notifica via Pop-it de 30 segundos
    if (typeof window.showArenaPopIt === 'function') {
      window.showArenaPopIt({
        title: '✓ Partida Excluída!',
        message: 'A partida de ' + nomeCliente + ' foi removida permanentemente do banco de dados e o horário liberado.',
        duration: 30
      });
    } else if (typeof arenaToast === 'function') {
      arenaToast('✓ Partida excluída com sucesso do banco de dados!');
    }
  };`;

if (!content.includes(oldCancelGameStart)) {
  console.error('oldCancelGameStart not found!');
  process.exit(1);
}

content = content.replace(oldCancelGameStart, newCancelGame);
fs.writeFileSync(adminPath, content, 'utf8');
console.log('Successfully updated cancelGame with direct cloud deletion & instant refresh!');
