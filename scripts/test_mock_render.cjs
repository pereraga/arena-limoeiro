
const window = {
  adminGameState: {
    selectedDate: '2026-11-09',
    movementFilterCourt: 'all',
    movementFilterStatus: 'all',
    bookings: [],
    monthlyMembers: [
      { id: '1', name: 'Davi', day_of_week: 'segunda', start_time: '15:00', end_time: '19:00', court_id: 'fut7', status: 'active', monthly_price: 280 }
    ],
    courts: [
      { id: 'fut7', name: 'Campo Society 01', type: 'society' }
    ]
  },
  __matchesCacheByDate: new Map(),
  getSystemToday: () => '2026-11-09',
  checkIsMatchLive: () => false,
  formatDisplayDate: (d) => d
};

const document = {
  getElementById: (id) => {
    console.log('[DOM] getElementById:', id);
    if (id === 'movementMatchesListContainer') {
      return {
        querySelectorAll: () => [],
        innerHTML: ''
      };
    }
    if (id === 'movementFeedTitle') return { innerHTML: '', textContent: '' };
    if (id === 'movementFeedCount') return { textContent: '' };
    return null;
  },
  querySelector: () => null
};

function formatDisplayDate(d) { return d; }
function getCourtById(id) { return { id: id || 'fut7', name: 'Campo Society 01' }; }

// We need getMatchesForDate as well
function getMatchesForDate(dateStr) {
    if (!dateStr) dateStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08');
    if (!window.__matchesCacheByDate) window.__matchesCacheByDate = new Map();
    if (window.__matchesCacheByDate.has(dateStr)) {
      return window.__matchesCacheByDate.get(dateStr);
    }
    const [y, m, d] = dateStr.split('-');
    const dt = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
    const dayOfWeekMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const currentDayOfWeek = dayOfWeekMap[dt.getDay()];

    // Regra: Finaliza todos os jogos dos dias anteriores (do dia 03 para trás)
    const sysTodayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08';
    const isPast = (dateStr < sysTodayStr);
    const defaultPastStatus = isPast ? 'finished' : 'confirmed';

    let matches = [];

    // 1. Mensalistas fixos do dia da semana
    (window.adminGameState.monthlyMembers || []).forEach(m => {
      if (!m || m.status === 'inactive') return;
      const mDay = (m.day_of_week || m.dayOfWeek || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (mDay === currentDayOfWeek) {
        const startT = m.start_time || m.startTime || m.time || '19:00';
        const endT = m.end_time || m.endTime || (startT.includes(':') ? String(Number(startT.split(':')[0]) + 1).padStart(2, '0') + ':' + startT.split(':')[1] : '20:00');
        const court = getCourtById(m.court_id || m.courtId);
        
        matches.push({
          id: 'monthly-' + m.id,
          court_id: court.id,
          court_name: court.name,
          date: dateStr,
          customer_name: (m.team_name || m.teamName || 'Mensalista') + (m.responsible_name && m.responsible_name !== m.team_name ? ' (' + m.responsible_name + ')' : ''),
          customer_phone: m.phone || '(81) 98765-4321',
          customer_cpf: m.cpf || '',
          start_time: startT,
          end_time: endT,
          time: startT + ' às ' + endT,
          total_price: parseFloat(m.monthly_price || m.monthlyPrice || 0) / 4 || 100,
          status: defaultPastStatus,
          isMensalista: true,
          booking_type: 'mensalista',
          payment_method: 'Mensalidade Faturada',
          observation: 'Horário Fixo Semanal (' + currentDayOfWeek.toUpperCase() + ')'
        });
      }
    });

    // 2. Reservas diretas da data (estritamente b.date === dateStr)
    (window.adminGameState.bookings || []).forEach(b => {
      if (!b) return;
      // Permite incluir reservas canceladas/sem pagamento para exibição nos filtros 'everything' e 'cancelled'
      if (b.date === dateStr) {
        // Manutenção de integridade: preserva status original finalizado ou cancelado
        const court = getCourtById(b.court_id || b.courtId);
        const startT = b.start_time || (b.time ? b.t

// Now let's run funcBody
try {
  function renderMovementMatches() {
    // Trava de recursão para evitar re-entrâncias durante a montagem do feed
    if (window.__isRenderingMovementMatches) return;
    window.__isRenderingMovementMatches = true;

    try {
      const dateStr = window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08');
    const container = document.getElementById('movementMatchesListContainer');
    const titleEl = document.getElementById('movementFeedTitle');
    const countEl = document.getElementById('movementFeedCount');

    // Auto-início e auto-encerramento/cancelamento de partidas após o horário
    if (typeof window.checkAndAutoStartMatches === 'function') {
      window.checkAndAutoStartMatches();
    }
    if (typeof window.checkAndAutoExpireMatches === 'function') {
      window.checkAndAutoExpireMatches();
    }

    if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();

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
        titleEl.innerHTML = 'Todas as Partidas de ' + formatDisplayDate(dateStr) + ' <span class="text-xs bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full font-bold ml-2">Geral (' + allMatches.length + ')</span>';
      } else if (statusFilter === 'unpaid' || statusFilter === 'cancelled') {
        titleEl.innerHTML = 'Partidas com Pagamento Faltando em ' + formatDisplayDate(dateStr) + ' <span class="text-xs bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold ml-2">Pagamento Faltando</span>';
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
      // Exibe TODAS as partidas do dia (ativas, finalizadas e com pagamento faltando)
    } else if (statusFilter === 'unpaid' || statusFilter === 'cancelled') {
      // Exibe exclusivamente partidas avulsas cujo pagamento está faltando
      matches = matches.filter(m => m.status === 'unpaid' || m.status === 'cancelled' || m.payment_status === 'pagamento_faltando' || (m.observation && m.observation.includes('Pagamento Faltando')));
    } else {
      // Padrão (all): Partidas ativas do momento (oculta finalizadas)
      matches = matches.filter(m => m.status !== 'finished');
    }

    if (countEl) {
      const singular = statusFilter === 'finished' ? ' partida finalizada' : (statusFilter === 'live' ? ' partida ao vivo' : ' partida listada');
      const plural = statusFilter === 'finished' ? ' partidas finalizadas' : (statusFilter === 'live' ? ' partidas ao vivo' : ' partidas listadas');
      countEl.textContent = matches.length + (matches.length === 1 ? singular : plural);
    }

    // Atualiza KPIs do topo com base no dia atual (Hoje / Faturamento real dinâmico)
    const currentToday = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08');
    const allTodayMatches = getMatchesForDate(currentToday);
    // Não contabiliza o valor dos fixos/mensalistas no faturamento diário de jogos avulsos
    const topRevenue = allTodayMatches.filter(m => !m.isMensalista && m.booking_type !== 'mensalista' && m.type !== 'Mensalista').reduce((acc, cur) => acc + (Number(cur.total_price) || 0), 0);
    const topLiveCount = allTodayMatches.filter(m => window.checkIsMatchLive(m, currentToday)).length;

    const kpiRev = document.getElementById('kpiValueRevenue') || document.querySelector('.kpi-value-revenue');
    const kpiGames = document.getElementById('kpiValueGames') || document.querySelector('.kpi-value-games');
    const kpiLive = document.getElementById('kpiValueLive') || document.querySelector('.kpi-value-live');

    if (kpiRev) kpiRev.textContent = 'R$ ' + topRevenue.toFixed(2).replace('.', ',');
    if (kpiGames) kpiGames.innerHTML = allTodayMatches.length + ' <span class="text-xs font-semibold text-slate-400">partidas</span>';
    if (kpiLive) kpiLive.innerHTML = topLiveCount + ' <span class="text-xs font-semibold text-slate-400">em quadra</span>';
    
    if (!container) return;
    if (!window.__openDetailsIds) window.__openDetailsIds = new Set();
    // Garante persistência dos painéis de detalhes que estejam abertos no DOM
    container.querySelectorAll('.booking-expanded-panel').forEach(p => {
      if (p.style.display !== 'none' && !p.classList.contains('hidden')) {
        const pid = p.id.replace('details-', '');
        if (pid) window.__openDetailsIds.add(String(pid));
      }
    });

    if (matches.length === 0) {
      if (statusFilter === 'finished') {
        container.innerHTML = `
          <div class="py-10 text-center text-slate-400 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 p-6">
            <div class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-2xl font-bold">✓</div>
            <h4 class="text-sm font-bold text-slate-800">Nenhuma partida finalizada até o momento para ${formatDisplayDate(dateStr)}.</h4>
            <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">As partidas concluídas aparecerão aqui imediatamente após o encerramento e finalização do jogo.</p>
            <button type="button" onclick="document.getElementById('movementStatusFilter').value='all'; filterMovementMatches();" class="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow inline-flex items-center gap-1.5 transition cursor-pointer">
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
              <span>Ver Partidas Ativas (${activeCount})</span>
            </button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="py-10 text-center text-slate-400 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 p-6">
            <i data-lucide="calendar-check" class="w-10 h-10 mx-auto mb-2 text-emerald-500"></i>
            <h4 class="text-sm font-bold text-slate-800">${finishedCount > 0 ? 'Todas as partidas ativas de ' + formatDisplayDate(dateStr) + ' foram concluídas!' : 'Nenhum jogo agendado com os filtros para esta data.'}</h4>
            <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">${finishedCount > 0 ? 'Existem ' + finishedCount + ' partida(s) finalizada(s) registrada(s) para este dia.' : 'Todos os campos estão livres para novas reservas ou manutenções.'}</p>
            <div class="flex items-center justify-center gap-2 mt-4 flex-wrap">
              ${finishedCount > 0 ? `
              <button type="button" onclick="document.getElementById('movementStatusFilter').value='finished'; filterMovementMatches();" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow inline-flex items-center gap-1.5 transition cursor-pointer">
                <span>✅ Ver ${finishedCount} Partida(s) Finalizada(s)</span>
              </button>
              ` : ''}
              <button type="button" onclick="openDirectBookingModal()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow inline-flex items-center gap-1.5 transition cursor-pointer">
                <i data-lucide="plus-circle" class="w-4 h-4"></i>
                <span>Nova Reserva Balcão</span>
              </button>
            </div>
          </div>
        `;
      }
    } else {
      container.innerHTML = matches.map((m, idx) => renderMatchCardHtml(m, idx === 0)).join('');
      if (window.location.search.includes('expand=1') || window.location.hash.includes('expandFirst')) {
        const firstPanel = container.querySelector('.booking-expanded-panel');
        if (firstPanel) { firstPanel.style.display = 'block'; firstPanel.classList.remove('hidden'); }
      }
      if (window.location.hash.includes('openEditFirst')) {
        setTimeout(() => { if (matches && matches[0]) openEditGame(matches[0].id); }, 200);
      }
      if (window.location.hash.includes('openContractFirst')) {
        setTimeout(() => { if (matches && matches[0]) openContract(matches[0].id); }, 200);
      }
      if (window.location.hash.includes('openBalcao')) {
        setTimeout(() => { openDirectBookingModal(); }, 200);
      }
      if (window.location.search.includes('finish=1') || window.location.hash.includes('openFinishFirst') || window.location.hash.includes('openFinishModal')) {
        setTimeout(() => {
          if (matches && matches[0]) {
            window.openFinishGame(matches[0].id);
            if (window.location.hash.includes('split') || window.location.search.includes('split=1')) {
              setTimeout(() => {
                window.setPaymentMode('split');
                window.onSplitAmountChange(1, 40);
              }, 100);
            }
          }
        }, 150);
      }
    }

    if (typeof window.updateMovementCalendarStrip === 'function') {
      window.updateMovementCalendarStrip();
    }
    if (window.lucide) lucide.createIcons();
    } finally {
      window.__isRenderingMovementMatches = false;
    }
  };
  window.renderMovementMatches = renderMovementMatches;

  win
  console.log('Running renderMovementMatches()...');
  renderMovementMatches();
  console.log('renderMovementMatches executed without crash!');
} catch (e) {
  console.error('CRASH in renderMovementMatches:', e);
}
