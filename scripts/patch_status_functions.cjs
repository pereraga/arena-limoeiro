const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let html = fs.readFileSync(adminPath, 'utf8');

// 1. Atualizar KPIs do topo com IDs e classes corretas para atualização dinâmica
const oldKpiSection = `      <!-- 3 KPIS OPERACIONAIS -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">JOGOS AGENDADOS</span>
          <span class="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block kpi-value-games">4 <span class="text-xs font-semibold text-slate-400">partidas</span></span>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <i data-lucide="calendar" class="w-6 h-6"></i>
        </div>
      </div>
      <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">AO VIVO AGORA</span>
          <span class="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">0 <span class="text-xs font-semibold text-slate-400">em quadra</span></span>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <i data-lucide="play" class="w-6 h-6"></i>
        </div>
      </div>
      <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">FATURAMENTO PREVISTO (HOJE)</span>
          <span class="text-2xl sm:text-3xl font-black text-emerald-700 mt-1 block">R$ 0,00</span>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <i data-lucide="dollar-sign" class="w-6 h-6"></i>
        </div>
      </div>
      </div>`;

const newKpiSection = `      <!-- 3 KPIS OPERACIONAIS -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">JOGOS AGENDADOS</span>
          <span class="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block kpi-value-games" id="kpiValueGames">0 <span class="text-xs font-semibold text-slate-400">partidas</span></span>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <i data-lucide="calendar" class="w-6 h-6"></i>
        </div>
      </div>
      <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">AO VIVO AGORA</span>
          <span class="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block kpi-value-live" id="kpiValueLive">0 <span class="text-xs font-semibold text-slate-400">em quadra</span></span>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <i data-lucide="play" class="w-6 h-6"></i>
        </div>
      </div>
      <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">FATURAMENTO PREVISTO (HOJE)</span>
          <span class="text-2xl sm:text-3xl font-black text-emerald-700 mt-1 block kpi-value-revenue" id="kpiValueRevenue">R$ 0,00</span>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <i data-lucide="dollar-sign" class="w-6 h-6"></i>
        </div>
      </div>
      </div>`;

if (!html.includes(oldKpiSection)) {
  console.error('oldKpiSection not found');
  process.exit(1);
}
html = html.replace(oldKpiSection, newKpiSection);
console.log('1. KPIs do topo atualizados com IDs.');

// 2. Injetar funções de ação por status: startGameNow, reopenGame, addExtraTimeQuick, viewReceipt
const newStatusHelperFunctions = `
  // Funções dedicadas para cada status de partida
  window.checkIsMatchLive = function(m, todayStr) {
    if (!m || m.status === 'finished' || m.status === 'cancelled') return false;
    if (m.status === 'live' || m.status === 'playing' || m.status === 'in_progress') return true;
    if (!todayStr) todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-03';
    if (m.date === todayStr) {
      const now = new Date();
      const curM = now.getHours() * 60 + now.getMinutes();
      const parseMin = s => {
        if (!s) return 0;
        const p = s.split(':');
        return parseInt(p[0], 10) * 60 + parseInt(p[1] || '0', 10);
      };
      const sM = parseMin(m.start_time);
      let eM = parseMin(m.end_time);
      if (eM <= sM) eM += 24 * 60;
      const extra = Number(m.extraTime || m.extra_minutes || 0);
      return curM >= sM && curM <= (eM + extra);
    }
    return false;
  };

  window.startGameNow = function(id) {
    const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
    if (!g) return;
    g.status = 'live';
    g.attendance = 'Presença confirmada';
    addMatchLog(g, 'Início manual na quadra', 'Atendente deu início à partida.');
    try {
      localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));
    } catch(e) {}
    if (typeof window.syncBookingToCloud === 'function') {
      window.syncBookingToCloud(g, 'upsert');
    }
    if (typeof window.arenaToast === 'function') {
      window.arenaToast('▶ Partida iniciada na quadra!');
    }
    renderMovementMatches();
  };

  window.reopenGame = function(id) {
    const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
    if (!g) return;
    if (!confirm('Deseja reabrir esta partida e torná-la ativa novamente?')) return;
    g.status = 'confirmed';
    g.attendance = 'Aguardando chegada';
    g.ballReturned = false;
    delete g.finishedAt;
    addMatchLog(g, 'Partida reaberta', 'A partida foi reaberta pelo gestor no painel.');
    try {
      localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));
    } catch(e) {}
    if (typeof window.syncBookingToCloud === 'function') {
      window.syncBookingToCloud(g, 'upsert');
    }
    if (typeof window.arenaToast === 'function') {
      window.arenaToast('↺ Partida reaberta com sucesso!');
    }
    renderMovementMatches();
  };

  window.addExtraTimeQuick = function(id, minutes) {
    const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
    if (!g) return;
    g.extraTime = (parseInt(g.extraTime || 0, 10)) + minutes;
    const court = (typeof getCourtById === 'function') ? getCourtById(g.court_id || g.courtId) : { normal: 100 };
    const hourlyRate = court && court.normal ? court.normal : 100;
    g.extraAmount = Math.round((g.extraTime / 60) * hourlyRate);
    addMatchLog(g, 'Tempo extra adicionado', '+' + minutes + ' min adicionados (Total extra: ' + g.extraTime + ' min)');
    try {
      localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));
    } catch(e) {}
    if (typeof window.syncBookingToCloud === 'function') {
      window.syncBookingToCloud(g, 'upsert');
    }
    if (typeof window.arenaToast === 'function') {
      window.arenaToast('⏱️ +' + minutes + ' min adicionados!');
    }
    renderMovementMatches();
  };

  window.viewReceipt = function(id) {
    const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
    if (!g) return;
    const court = (typeof getCourtById === 'function') ? getCourtById(g.court_id || g.courtId) : { name: 'Quadra' };
    const price = Number(g.total_price || g.price || 100).toFixed(2).replace('.', ',');
    const modalContent = \`
      <div class="p-5 sm:p-6 text-center">
        <div class="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-2xl font-black">✓</div>
        <h3 class="text-base sm:text-lg font-black text-slate-900">Comprovante de Partida Concluída</h3>
        <p class="text-xs text-slate-500 mb-4">Arena Limoeiro - Complexo Poliesportivo e Lazer</p>
        <div class="bg-slate-50 rounded-2xl p-4 text-left space-y-2 text-xs border border-slate-200">
          <div class="flex justify-between border-b border-slate-200 pb-1.5"><strong>Cliente / Time:</strong> <span class="font-bold text-slate-800">\${g.customer_name || 'Cliente'}</span></div>
          <div class="flex justify-between border-b border-slate-200 pb-1.5"><strong>Quadra:</strong> <span>\${court.name}</span></div>
          <div class="flex justify-between border-b border-slate-200 pb-1.5"><strong>Data & Horário:</strong> <span>\${g.date} (\${g.start_time} às \${g.end_time})</span></div>
          <div class="flex justify-between border-b border-slate-200 pb-1.5"><strong>Valor Final:</strong> <span class="font-black text-emerald-700">R$ \${price}</span></div>
          <div class="flex justify-between border-b border-slate-200 pb-1.5"><strong>Forma Pagamento:</strong> <span>\${g.payment || 'PIX Balcão'}</span></div>
          <div class="flex justify-between border-b border-slate-200 pb-1.5"><strong>Bola Devolvida:</strong> <span class="text-emerald-700 font-bold">\${g.ballReturned !== false ? '✓ Devolvida & Conferida' : 'Pendente'}</span></div>
          \${g.finishedAt ? \`<div class="flex justify-between"><strong>Horário Fechamento:</strong> <span>\${g.finishedAt}</span></div>\` : ''}
        </div>
        <div class="mt-5 flex gap-2 justify-center">
          <button onclick="window.print()" class="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow hover:bg-slate-800 transition cursor-pointer">Imprimir Recibo</button>
          <button onclick="document.getElementById('receiptGenericModal').style.display='none'" class="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-black hover:bg-slate-300 transition cursor-pointer">Fechar</button>
        </div>
      </div>
    \`;
    let mEl = document.getElementById('receiptGenericModal');
    if (!mEl) {
      mEl = document.createElement('div');
      mEl.id = 'receiptGenericModal';
      mEl.className = 'fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4';
      mEl.innerHTML = \`<div class="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-200" id="receiptGenericModalInner"></div>\`;
      document.body.appendChild(mEl);
    }
    document.getElementById('receiptGenericModalInner').innerHTML = modalContent;
    mEl.style.display = 'flex';
  };
`;

// Inserir antes de renderMatchCardHtml
const targetBeforeRender = `  // Renderizador Oficial do Card de Partida (IDÊNTICO À FOTO FORNECIDA PELO USUÁRIO)
  function renderMatchCardHtml(m, isNextUpcoming) {`;

if (!html.includes(targetBeforeRender)) {
  console.error('targetBeforeRender not found');
  process.exit(1);
}
html = html.replace(targetBeforeRender, newStatusHelperFunctions + '\n' + targetBeforeRender);
console.log('2. Funções auxiliares de status injetadas com sucesso.');

// 3. Atualizar renderMatchCardHtml para exibir funções devidas em cada status
const oldCardActions = `            <div class="booking-quick-actions">
              \${st === 'finished' ? \`
                <span class="text-xs font-black text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-xl px-3 py-2 inline-flex items-center gap-1.5 shadow-sm">
                  ✓ Finalizada · Bola Recebida
                </span>
              \` : \`
                <button type="button" class="booking-finish-red-btn" onclick="openFinishGame('\${m.id}')" title="Encerrar aula/jogo e receber a bola" style="\${isFutureDay ? 'background: #1e293b !important; border: 1px solid #334155 !important; box-shadow: 0 2px 4px rgba(15,23,42,0.15) !important;' : 'background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important; border: 1px solid #b91c1c !important; box-shadow: 0 3px 8px rgba(220,38,38,0.35) !important;'} color: #ffffff !important; border-radius: 12px !important; padding: 9px 15px !important; font-size: 12px !important; font-weight: 900 !important; display: inline-flex !important; align-items: center !important; gap: 8px !important; cursor: pointer !important;">
                  <span class="btn-ball-icon" style="font-size: 15px; line-height: 1;">⚽</span>
                  <span>\${isFutureDay ? 'Concluir Jogo' : 'Finalizar / Receber Bola'}</span>
                </button>
              \`}
            </div>`;

const newCardActions = `            <div class="booking-quick-actions">
              \${st === 'finished' ? \`
                <div class="flex items-center gap-2">
                  <span class="text-xs font-black text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-xl px-3 py-2 inline-flex items-center gap-1.5 shadow-sm">
                    ✓ Finalizada · Bola Recebida
                  </span>
                  <button type="button" onclick="viewReceipt('\${m.id}')" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer" title="Ver Comprovante">
                    📄 Recibo
                  </button>
                </div>
              \` : \`
                <button type="button" class="booking-finish-red-btn" onclick="openFinishGame('\${m.id}')" title="Encerrar aula/jogo e receber a bola" style="\${isFutureDay ? 'background: #1e293b !important; border: 1px solid #334155 !important; box-shadow: 0 2px 4px rgba(15,23,42,0.15) !important;' : 'background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important; border: 1px solid #b91c1c !important; box-shadow: 0 3px 8px rgba(220,38,38,0.35) !important;'} color: #ffffff !important; border-radius: 12px !important; padding: 9px 15px !important; font-size: 12px !important; font-weight: 900 !important; display: inline-flex !important; align-items: center !important; gap: 8px !important; cursor: pointer !important;">
                  <span class="btn-ball-icon" style="font-size: 15px; line-height: 1;">⚽</span>
                  <span>\${isFutureDay ? 'Concluir Jogo' : 'Finalizar / Receber Bola'}</span>
                </button>
              \`}
            </div>`;

if (!html.includes(oldCardActions)) {
  console.error('oldCardActions not found');
  process.exit(1);
}
html = html.replace(oldCardActions, newCardActions);
console.log('3. Botões rápidos do card atualizados por status.');

// 4. Atualizar os botões do accordion de detalhes por status
const oldDetailActions = `          <div class="booking-detail-actions">
            <button type="button" class="booking-quick-btn" onclick="openEditGame('\${m.id}')">
              ✎ Editar jogo
            </button>
            <button type="button" class="booking-quick-btn" onclick="openContract('\${m.id}')">
              ▤ Editar contrato
            </button>
            <button type="button" class="booking-quick-btn bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 font-black" onclick="openFinishGame('\${m.id}')">
              ✓ Concluir / Fechar partida
            </button>
            <button type="button" class="booking-quick-btn" onclick="openNoShow('\${m.id}')">
              ! Não compareceu
            </button>
            <button type="button" class="booking-quick-btn btn-danger" onclick="cancelGame('\${m.id}')">
              Cancelar partida
            </button>
          </div>`;

const newDetailActions = `          <div class="booking-detail-actions">
            \${st === 'finished' ? \`
              <button type="button" class="booking-quick-btn bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 font-black" onclick="viewReceipt('\${m.id}')">
                📄 Ver Comprovante / Recibo
              </button>
              <button type="button" class="booking-quick-btn bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 font-bold" onclick="reopenGame('\${m.id}')">
                ↺ Reabrir Jogo (Tornar Ativo)
              </button>
              <button type="button" class="booking-quick-btn" onclick="openEditGame('\${m.id}')">
                ✎ Ver Detalhes da Reserva
              </button>
            \` : \`
              <button type="button" class="booking-quick-btn" onclick="openEditGame('\${m.id}')">
                ✎ Editar jogo
              </button>
              <button type="button" class="booking-quick-btn" onclick="openContract('\${m.id}')">
                ▤ Editar contrato
              </button>
              \${(window.checkIsMatchLive && window.checkIsMatchLive(m)) ? \`
                <button type="button" class="booking-quick-btn bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-300 font-bold" onclick="addExtraTimeQuick('\${m.id}', 15)">
                  ⏱️ +15m Tempo Extra
                </button>
              \` : \`
                <button type="button" class="booking-quick-btn bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 font-bold" onclick="startGameNow('\${m.id}')">
                  ▶ Iniciar Jogo na Quadra
                </button>
              \`}
              <button type="button" class="booking-quick-btn bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 font-black" onclick="openFinishGame('\${m.id}')">
                ⚽ Concluir / Receber Bola
              </button>
              <button type="button" class="booking-quick-btn" onclick="openNoShow('\${m.id}')">
                ! Não compareceu
              </button>
              <button type="button" class="booking-quick-btn btn-danger" onclick="cancelGame('\${m.id}')">
                Cancelar partida
              </button>
            \`}
          </div>`;

if (!html.includes(oldDetailActions)) {
  console.error('oldDetailActions not found');
  process.exit(1);
}
html = html.replace(oldDetailActions, newDetailActions);
console.log('4. Ações de detalhes atualizadas por status.');

// 5. Atualizar renderMovementMatches com filtro resiliente e cálculo dinâmico de KPIs
const oldRenderBody = `  function renderMovementMatches() {
    const dateStr = window.adminGameState.selectedDate || '2026-11-03';
    const container = document.getElementById('movementMatchesListContainer');
    const titleEl = document.getElementById('movementFeedTitle');
    const countEl = document.getElementById('movementFeedCount');

    // Recupera TODAS as partidas do dia para estatísticas completas
    const allMatches = getMatchesForDate(dateStr);
    const finishedCount = allMatches.filter(m => m.status === 'finished').length;
    const activeCount = allMatches.filter(m => m.status !== 'finished').length;
    const liveCount = allMatches.filter(m => m.status === 'live' || m.status === 'playing' || m.status === 'in_progress').length;

    // Filtros de Quadra e Status
    const courtFilter = window.adminGameState.movementFilterCourt || 'all';
    const statusFilter = window.adminGameState.movementFilterStatus || 'all';

    // Atualiza sincronizadamente o select de status se existir
    const statusSelectEl = document.getElementById('movementStatusFilter');
    if (statusSelectEl && statusSelectEl.value !== statusFilter) {
      statusSelectEl.value = statusFilter;
    }

    if (titleEl) {
      if (statusFilter === 'finished') {
        titleEl.innerHTML = 'Partidas Finalizadas de ' + formatDisplayDate(dateStr) + ' <span class="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold ml-2">Histórico Concluído</span>';
      } else if (statusFilter === 'everything') {
        titleEl.textContent = 'Todas as Partidas (Ativas e Concluídas) de ' + formatDisplayDate(dateStr);
      } else if (statusFilter === 'live') {
        titleEl.textContent = 'Partidas Ao Vivo em ' + formatDisplayDate(dateStr);
      } else {
        titleEl.textContent = 'Partidas Programadas para ' + formatDisplayDate(dateStr);
      }
    }

    let matches = allMatches;

    if (courtFilter && courtFilter !== 'all') {
      const targetCourt = getCourtById(courtFilter);
      matches = matches.filter(m => {
        const mCourt = getCourtById(m.court_id || m.courtId);
        return mCourt.id === targetCourt.id || m.court_id === courtFilter;
      });
    }

    if (statusFilter === 'finished') {
      matches = matches.filter(m => m.status === 'finished');
    } else if (statusFilter === 'live') {
      matches = matches.filter(m => m.status === 'live' || m.status === 'playing' || m.status === 'in_progress');
    } else if (statusFilter === 'confirmed') {
      matches = matches.filter(m => m.status === 'confirmed');
    } else if (statusFilter === 'everything') {
      // Exibe todas, inclusive finalizadas
    } else {
      // REGRA: Ao concluir e salvar jogos, o jogo finalizado some da janela operacional
      matches = matches.filter(m => m.status !== 'finished');
    }

    if (countEl) {
      countEl.textContent = matches.length + (matches.length === 1 ? ' partida listada' : ' partidas listadas');
    }

    // Atualiza KPIs do topo com base no dia atual (Hoje / Adaptação dinâmica ao virar o dia)
    const currentToday = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-03';
    const allTodayMatches = getMatchesForDate(currentToday);
    const topRevenue = allTodayMatches.reduce((acc, cur) => acc + (Number(cur.total_price) || 0), 0);
    const kpiRev = document.querySelector('.kpi-value-revenue');
    const kpiGames = document.querySelector('.kpi-value-games');
    if (kpiRev) kpiRev.textContent = 'R$ ' + topRevenue.toFixed(2).replace('.', ',');
    if (kpiGames) kpiGames.textContent = allTodayMatches.length + ' partidas';`;

const newRenderBody = `  function renderMovementMatches() {
    const dateStr = window.adminGameState.selectedDate || '2026-11-03';
    const container = document.getElementById('movementMatchesListContainer');
    const titleEl = document.getElementById('movementFeedTitle');
    const countEl = document.getElementById('movementFeedCount');

    // Recupera TODAS as partidas do dia para estatísticas completas
    const allMatches = getMatchesForDate(dateStr);
    const finishedCount = allMatches.filter(m => m.status === 'finished').length;
    const activeCount = allMatches.filter(m => m.status !== 'finished' && m.status !== 'cancelled').length;
    const liveCount = allMatches.filter(m => window.checkIsMatchLive(m, dateStr)).length;

    // Lê os filtros diretamente dos elementos selecionados no DOM para fidelidade total
    const courtSelectEl = document.getElementById('movementCourtFilter');
    const courtFilter = courtSelectEl ? courtSelectEl.value : (window.adminGameState.movementFilterCourt || 'all');
    window.adminGameState.movementFilterCourt = courtFilter;

    const statusSelectEl = document.getElementById('movementStatusFilter');
    const statusFilter = statusSelectEl ? statusSelectEl.value : (window.adminGameState.movementFilterStatus || 'all');
    window.adminGameState.movementFilterStatus = statusFilter;

    // Atualiza o Título do Feed de acordo com o tópico de status selecionado
    if (titleEl) {
      if (statusFilter === 'finished') {
        titleEl.innerHTML = 'Partidas Finalizadas de ' + formatDisplayDate(dateStr) + ' <span class="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold ml-2">Histórico Concluído</span>';
      } else if (statusFilter === 'everything') {
        titleEl.innerHTML = 'Todas as Partidas (Ativas e Concluídas) de ' + formatDisplayDate(dateStr) + ' <span class="text-xs bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full font-bold ml-2">Geral (' + allMatches.length + ')</span>';
      } else if (statusFilter === 'live') {
        titleEl.innerHTML = 'Partidas Ao Vivo / Em Andamento em ' + formatDisplayDate(dateStr) + ' <span class="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold ml-2 animate-pulse">● Na Quadra</span>';
      } else if (statusFilter === 'confirmed') {
        titleEl.innerHTML = 'Próximas Partidas Confirmadas para ' + formatDisplayDate(dateStr) + ' <span class="text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold ml-2">Programadas</span>';
      } else {
        titleEl.textContent = 'Partidas Programadas para ' + formatDisplayDate(dateStr);
      }
    }

    let matches = allMatches;

    // 1. Filtro por Quadra
    if (courtFilter && courtFilter !== 'all') {
      const targetCourt = getCourtById(courtFilter);
      matches = matches.filter(m => {
        const mCourt = getCourtById(m.court_id || m.courtId);
        return mCourt.id === targetCourt.id || m.court_id === courtFilter;
      });
    }

    // 2. Filtro estrito por cada tópico de Status
    if (statusFilter === 'finished') {
      matches = matches.filter(m => m.status === 'finished');
    } else if (statusFilter === 'live') {
      matches = matches.filter(m => window.checkIsMatchLive(m, dateStr));
    } else if (statusFilter === 'confirmed') {
      matches = matches.filter(m => m.status !== 'finished' && m.status !== 'cancelled' && !window.checkIsMatchLive(m, dateStr));
    } else if (statusFilter === 'everything') {
      // Exibe todas (com finalizadas)
      matches = matches.filter(m => m.status !== 'cancelled');
    } else {
      // Padrão (all): Partidas ativas (oculta finalizadas e canceladas)
      matches = matches.filter(m => m.status !== 'finished' && m.status !== 'cancelled');
    }

    if (countEl) {
      const singular = statusFilter === 'finished' ? ' partida finalizada' : (statusFilter === 'live' ? ' partida ao vivo' : ' partida listada');
      const plural = statusFilter === 'finished' ? ' partidas finalizadas' : (statusFilter === 'live' ? ' partidas ao vivo' : ' partidas listadas');
      countEl.textContent = matches.length + (matches.length === 1 ? singular : plural);
    }

    // Atualiza KPIs do topo com base no dia atual (Hoje / Faturamento real dinâmico)
    const currentToday = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-03';
    const allTodayMatches = getMatchesForDate(currentToday);
    const topRevenue = allTodayMatches.reduce((acc, cur) => acc + (Number(cur.total_price) || 0), 0);
    const topLiveCount = allTodayMatches.filter(m => window.checkIsMatchLive(m, currentToday)).length;

    const kpiRev = document.getElementById('kpiValueRevenue') || document.querySelector('.kpi-value-revenue');
    const kpiGames = document.getElementById('kpiValueGames') || document.querySelector('.kpi-value-games');
    const kpiLive = document.getElementById('kpiValueLive') || document.querySelector('.kpi-value-live');

    if (kpiRev) kpiRev.textContent = 'R$ ' + topRevenue.toFixed(2).replace('.', ',');
    if (kpiGames) kpiGames.innerHTML = allTodayMatches.length + ' <span class="text-xs font-semibold text-slate-400">partidas</span>';
    if (kpiLive) kpiLive.innerHTML = topLiveCount + ' <span class="text-xs font-semibold text-slate-400">em quadra</span>';`;

if (!html.includes(oldRenderBody)) {
  console.error('oldRenderBody not found');
  process.exit(1);
}
html = html.replace(oldRenderBody, newRenderBody);
console.log('5. renderMovementMatches atualizada com filtragem por tópico e KPIs reais.');

fs.writeFileSync(adminPath, html, 'utf8');
console.log('admin.html gravado com sucesso.');
