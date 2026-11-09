const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

// 1. In getMatchesForDate, refine duplicate check: only deduplicate against monthly members, not between two avulso bookings!
const oldDedup = `        // Evita duplicatas se já existe mensalista no mesmo horário e campo, mantendo a data estrita
        const existing = matches.find(m => String(m.id) === String(b.id) || (m.court_id === court.id && m.start_time === startT));
        if (existing) {
          existing.status = (isPast ? 'finished' : (b.status || existing.status));
          if (b.payment_method) existing.payment_method = b.payment_method;
          if (b.total_price) existing.total_price = b.total_price;
          if (b.ballReturned !== undefined) existing.ballReturned = b.ballReturned;
          if (b.finishedAt) existing.finishedAt = b.finishedAt;
          if (b.customer_name) existing.customer_name = b.customer_name;
          if (b.customer_phone) existing.customer_phone = b.customer_phone;
          existing.date = dateStr;
        } else {`;

const newDedup = `        // Evita duplicatas se já existe registro com o MESMO ID ou se já existe um mensalista fixo cadastrado para o mesmo horário e quadra
        const existing = matches.find(m => String(m.id) === String(b.id) || (m.isMensalista && m.court_id === court.id && m.start_time === startT));
        if (existing) {
          existing.status = (isPast ? 'finished' : (b.status || existing.status));
          if (b.payment_method) existing.payment_method = b.payment_method;
          if (b.total_price) existing.total_price = b.total_price;
          if (b.ballReturned !== undefined) existing.ballReturned = b.ballReturned;
          if (b.finishedAt) existing.finishedAt = b.finishedAt;
          if (b.customer_name) existing.customer_name = b.customer_name;
          if (b.customer_phone) existing.customer_phone = b.customer_phone;
          existing.date = dateStr;
        } else {`;

if (!content.includes(oldDedup)) {
  console.error('oldDedup not found!');
  process.exit(1);
}
content = content.replace(oldDedup, newDedup);

// 2. In handleSaveDirectBooking, ensure immediate cache clearing, calendar strip update and force UI refresh
const oldSaveDirectEnd = `    // 5. Atualiza a tela imediatamente
    closeDirectBookingModal();
    if (window.adminGameState.selectedDate !== date) {
      window.selectMovementDay(date);
    } else {
      renderMovementMatches();
    }
    renderCadastrosBookingsList();`;

const newSaveDirectEnd = `    // 5. Limpa cache e atualiza a tela e contadores imediatamente
    if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();
    closeDirectBookingModal();
    if (window.adminGameState.selectedDate !== date) {
      window.selectMovementDay(date);
    } else {
      if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();
    }
    if (typeof window.updateMovementCalendarStrip === 'function') window.updateMovementCalendarStrip();
    if (typeof window.renderMovementCalendarStrip === 'function') window.renderMovementCalendarStrip();
    if (typeof window.renderCadastrosBookingsList === 'function') window.renderCadastrosBookingsList();`;

if (!content.includes(oldSaveDirectEnd)) {
  console.error('oldSaveDirectEnd not found!');
  process.exit(1);
}
content = content.replace(oldSaveDirectEnd, newSaveDirectEnd);

// 3. In deleteMatchPrompt, also handle monthly cancellation, clear cache and update strip + Pop-it feedback
const oldDeletePrompt = `  window.deleteMatchPrompt = async function(id) {
    const bookingToDelete = (window.adminGameState.bookings || []).find(b => String(b.id) === String(id)) || { id: id };
    const nomeCliente = bookingToDelete.customer_name || bookingToDelete.name || 'este agendamento';
    const confirmado = await window.mostrarConfirmacaoArena({
      titulo: 'Cancelar Agendamento',
      mensagem: \`Deseja realmente cancelar e liberar o horário de <strong class="text-slate-900">"\${nomeCliente}"</strong>?\`,
      tipo: 'danger',
      textoConfirmar: 'Sim, Cancelar',
      textoCancelar: 'Manter'
    });
    if (!confirmado) return;
    window.adminGameState.bookings = window.adminGameState.bookings.filter(b => String(b.id) !== String(id));
    

    // ☁️ Deleta imediatamente de ambos os bancos na nuvem e registra imunidade
    if (typeof window.syncBookingToCloud === 'function') {
      window.syncBookingToCloud(bookingToDelete, 'delete');
    }

    if (typeof window.renderMovementMatches === "function") window.renderMovementMatches();
    if (typeof window.renderCadastrosBookingsList === "function") window.renderCadastrosBookingsList();
    alert('Horário liberado com sucesso!');
  };`;

const newDeletePrompt = `  window.deleteMatchPrompt = async function(id) {
    const isMonthlyId = String(id).startsWith('monthly-');
    const realId = isMonthlyId ? String(id).replace('monthly-', '') : String(id);

    let bookingToDelete = (window.adminGameState.bookings || []).find(b => String(b.id) === String(id) || String(b.id) === realId);
    if (!bookingToDelete && isMonthlyId) {
      bookingToDelete = (window.adminGameState.monthlyMembers || []).find(m => String(m.id) === realId);
    }
    bookingToDelete = bookingToDelete || { id: id };

    const nomeCliente = bookingToDelete.customer_name || bookingToDelete.name || bookingToDelete.responsible_name || 'este agendamento';
    const confirmado = await window.mostrarConfirmacaoArena({
      titulo: 'Excluir / Cancelar Partida',
      mensagem: \`Deseja realmente excluir permanentemente a partida de <strong class="text-slate-900">"\${nomeCliente}"</strong> e liberar o horário na quadra?\`,
      tipo: 'danger',
      textoConfirmar: 'Sim, Excluir Partida',
      textoCancelar: 'Manter'
    });
    if (!confirmado) return;

    // Remove do estado operacional
    window.adminGameState.bookings = (window.adminGameState.bookings || []).filter(b => String(b.id) !== String(id) && String(b.id) !== realId);
    if (isMonthlyId) {
      window.adminGameState.monthlyMembers = (window.adminGameState.monthlyMembers || []).filter(m => String(m.id) !== realId);
    }

    // ☁️ Deleta imediatamente de ambos os bancos na nuvem (Dual-Delete em paralelo)
    const dbDelete = async (dbUrl, dbKey, table, targetId) => {
      try {
        await fetch(dbUrl + '/rest/v1/' + table + '?id=eq.' + encodeURIComponent(targetId), {
          method: 'DELETE',
          headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey, Prefer: 'return=minimal' }
        });
      } catch(e) {}
    };

    const targetTable = isMonthlyId ? 'monthly_members' : 'bookings';
    Promise.allSettled([
      dbDelete(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key, targetTable, realId),
      dbDelete(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key, targetTable, realId),
      dbDelete(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key, 'bookings', id),
      dbDelete(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key, 'bookings', id)
    ]);

    // Limpa caches e re-renderiza régua e lista
    if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();
    if (typeof window.renderMovementMatches === "function") window.renderMovementMatches();
    if (typeof window.updateMovementCalendarStrip === 'function') window.updateMovementCalendarStrip();
    if (typeof window.renderMovementCalendarStrip === 'function') window.renderMovementCalendarStrip();
    if (typeof window.renderCadastrosBookingsList === "function") window.renderCadastrosBookingsList();

    if (typeof window.showArenaPopIt === 'function') {
      window.showArenaPopIt({
        title: '✓ Horário Liberado com Sucesso!',
        message: 'A partida de ' + nomeCliente + ' foi cancelada e excluída do banco de dados.',
        duration: 30
      });
    } else {
      arenaToast('✓ Horário liberado com sucesso!');
    }
  };`;

if (!content.includes(oldDeletePrompt)) {
  console.error('oldDeletePrompt not found!');
  process.exit(1);
}
content = content.replace(oldDeletePrompt, newDeletePrompt);

fs.writeFileSync(adminPath, content, 'utf8');
console.log('Successfully applied booking sync, counter update, and delete enhancements to admin.html!');
