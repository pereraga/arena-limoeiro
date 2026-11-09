const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

// 1. Head confirm replacement
const targetHead = '<script>\n    try {\n      const adminUser = {';
const replHead = '<script>\n    // Substitui confirm() nativo por modal visual caso seja invocado nativamente\n    window.originalConfirm = window.confirm;\n    window.confirm = function(msg) {\n      if (typeof window.mostrarConfirmacaoArena === "function") {\n        window.mostrarConfirmacaoArena({ titulo: "Confirmação", mensagem: msg, tipo: "danger", textoConfirmar: "Confirmar", textoCancelar: "Cancelar" });\n        return true;\n      }\n      return window.originalConfirm ? window.originalConfirm(msg) : true;\n    };\n    try {\n      const adminUser = {';

if (html.includes(targetHead)) {
  html = html.replace(targetHead, replHead);
  console.log('1. Head confirm replacement applied.');
} else {
  console.log('1. Head pattern not found or already replaced.');
}

// 2. getMatchesForDate: Exclude deleted matches
const targetGetMatches = 'matches = matches.filter(m => {\n      if (!m) return false;\n      if (m.date !== dateStr) return false;';
const replGetMatches = `// Exclusão de partidas canceladas/removidas
    let excluidosMap = {};
    try {
      const savedExcl = localStorage.getItem('arena_jogos_excluidos_v1');
      if (savedExcl) excluidosMap = JSON.parse(savedExcl);
    } catch(e) {}

    matches = matches.filter(m => {
      if (!m) return false;
      const exKey = m.id + '_' + dateStr;
      if (excluidosMap[exKey]) return false;
      if (m.id && String(m.id).startsWith('monthly-')) {
        const rawMid = String(m.id).replace('monthly-', '');
        if (excluidosMap[rawMid + '_' + dateStr]) return false;
      }
      if (m.date !== dateStr) return false;`;

if (html.includes(targetGetMatches)) {
  html = html.replace(targetGetMatches, replGetMatches);
  console.log('2. getMatchesForDate exclusion applied.');
} else {
  console.log('2. getMatches pattern not found.');
}

// 3. cancelGame replacement
const targetCancelIdx = html.indexOf('window.cancelGame = async function(id) {');
if (targetCancelIdx !== -1) {
  const nextFuncIdx = html.indexOf('// 6. Confirmar Chegada / Presença', targetCancelIdx);
  if (nextFuncIdx !== -1) {
    const newCancelGame = `window.cancelGame = async function(id) {
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
  };

  `;
    html = html.substring(0, targetCancelIdx) + newCancelGame + html.substring(nextFuncIdx);
    console.log('3. cancelGame function replaced successfully.');
  }
}

// 4. Update handleExcluirClienteModal to register deleted customer in arena_clientes_excluidos_v1
const targetDeleteCust = 'window.fecharModalGerenciarCliente();\n      window.renderCadastrosClientes();';
const replDeleteCust = `try {
        let exclCust = {};
        const s = localStorage.getItem('arena_clientes_excluidos_v1');
        if (s) exclCust = JSON.parse(s);
        exclCust[keyName] = { name: nome, at: new Date().toISOString() };
        localStorage.setItem('arena_clientes_excluidos_v1', JSON.stringify(exclCust));
      } catch(e) {}

      window.fecharModalGerenciarCliente();
      window.renderCadastrosClientes();`;

if (html.includes(targetDeleteCust)) {
  html = html.replace(targetDeleteCust, replDeleteCust);
  console.log('4. Customer exclusion persistence added.');
} else {
  console.log('4. Customer exclusion pattern not matched.');
}

// 5. In obterListaAgregadaClientes, filter out any customer in arena_clientes_excluidos_v1
const targetAgregada = 'return Array.from(clientMap.values());';
const replAgregada = `let exclCustMap = {};
    try {
      const s = localStorage.getItem('arena_clientes_excluidos_v1');
      if (s) exclCustMap = JSON.parse(s);
    } catch(e) {}

    const list = Array.from(clientMap.values()).filter(c => {
      const k = (c.name || '').trim().toLowerCase();
      return !exclCustMap[k];
    });
    return list;`;

if (html.includes(targetAgregada)) {
  html = html.replace(targetAgregada, replAgregada);
  console.log('5. obterListaAgregadaClientes exclusion filter added.');
} else {
  console.log('5. obterListaAgregadaClientes pattern not matched.');
}

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('All patches written to public/admin.html.');
