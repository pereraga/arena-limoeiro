const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let html = fs.readFileSync(adminPath, 'utf8');

// 1. Inserir a barra de atalhos rápidos de filtro por status
const targetFilterDiv = `          <!-- Filtro Status -->
          <div class="flex items-center gap-2 w-full bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 sm:py-1.5 transition shadow-2xs">
            <span class="text-[11px] sm:text-xs font-black uppercase text-slate-700 shrink-0 flex items-center gap-1 min-w-[65px]">
              <i data-lucide="activity" class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600"></i> Status:
            </span>
            <div class="relative flex-1 min-w-[130px]">
              <select id="movementStatusFilter" onchange="filterMovementMatches()" class="w-full py-1.5 sm:py-2 pl-2 pr-7 border-0 rounded-lg text-xs font-bold text-slate-800 bg-transparent focus:ring-2 focus:ring-emerald-600 truncate appearance-none cursor-pointer">
                <option value="all">Partidas Ativas (Ocultar Finalizadas)</option>
                <option value="live">🟢 Ao Vivo / Em Andamento</option>
                <option value="confirmed">🔵 Confirmados / Próximos</option>
                <option value="finished">✅ Finalizados / Concluídos</option>
                <option value="everything">👁 Exibir Todas (Com Finalizadas)</option>
              </select>
              <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            </div>
          </div>

        </div>`;

const newFilterWithPills = `          <!-- Filtro Status -->
          <div class="flex items-center gap-2 w-full bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 sm:py-1.5 transition shadow-2xs">
            <span class="text-[11px] sm:text-xs font-black uppercase text-slate-700 shrink-0 flex items-center gap-1 min-w-[65px]">
              <i data-lucide="activity" class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600"></i> Status:
            </span>
            <div class="relative flex-1 min-w-[130px]">
              <select id="movementStatusFilter" onchange="filterMovementMatches()" class="w-full py-1.5 sm:py-2 pl-2 pr-7 border-0 rounded-lg text-xs font-bold text-slate-800 bg-transparent focus:ring-2 focus:ring-emerald-600 truncate appearance-none cursor-pointer">
                <option value="all">⚡ Partidas Ativas (Ocultar Finalizadas)</option>
                <option value="finished">✅ Finalizados / Concluídos</option>
                <option value="live">🟢 Ao Vivo / Em Andamento</option>
                <option value="confirmed">🔵 Confirmados / Próximos</option>
                <option value="everything">👁 Exibir Todas (Com Finalizadas)</option>
              </select>
              <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            </div>
          </div>

          <!-- Atalhos Rápidos de Filtro por Status (Visibilidade Instantânea e Responsiva) -->
          <div class="col-span-1 sm:col-span-2 flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 border-t border-slate-100" id="movementFilterPills">
            <span class="text-[11px] font-black uppercase text-slate-500 mr-1 flex items-center gap-1">
              <i data-lucide="sliders-horizontal" class="w-3 h-3 text-slate-400"></i> Filtrar:
            </span>
            <button type="button" id="pillFilterActive" onclick="setMovementQuickFilter('all')" class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 bg-emerald-600 text-white shadow-xs">
              <span>⚡ Partidas Ativas</span>
              <span id="pillActiveCount" class="bg-emerald-700 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">0</span>
            </button>
            <button type="button" id="pillFilterFinished" onclick="setMovementQuickFilter('finished')" class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200">
              <span class="text-emerald-600 font-bold">✅</span>
              <span>Finalizados</span>
              <span id="pillFinishedCount" class="bg-slate-200 text-slate-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">0</span>
            </button>
            <button type="button" id="pillFilterLive" onclick="setMovementQuickFilter('live')" class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Ao Vivo</span>
              <span id="pillLiveCount" class="bg-slate-200 text-slate-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">0</span>
            </button>
            <button type="button" id="pillFilterEverything" onclick="setMovementQuickFilter('everything')" class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200">
              <span>👁 Exibir Todas</span>
              <span id="pillTotalCount" class="bg-slate-200 text-slate-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">0</span>
            </button>
          </div>

        </div>`;

if (!html.includes(targetFilterDiv)) {
  console.error('Target filter div not found!');
  process.exit(1);
}
html = html.replace(targetFilterDiv, newFilterWithPills);
console.log('Filtros HTML atualizados com sucesso.');

// 2. Atualizar renderMovementMatches e filterMovementMatches
const oldRenderMatches = `  function renderMovementMatches() {
    const dateStr = window.adminGameState.selectedDate || '2026-11-03';
    const container = document.getElementById('movementMatchesListContainer');
    const titleEl = document.getElementById('movementFeedTitle');
    const countEl = document.getElementById('movementFeedCount');

    if (titleEl) {
      titleEl.textContent = 'Partidas Programadas para ' + formatDisplayDate(dateStr);
    }

    let matches = getMatchesForDate(dateStr);

    // Filtros de Quadra e Status
    const courtFilter = window.adminGameState.movementFilterCourt;
    const statusFilter = window.adminGameState.movementFilterStatus;

    if (courtFilter && courtFilter !== 'all') {
      matches = matches.filter(m => m.court_id === courtFilter);
    }
    if (statusFilter === 'finished') {
      matches = matches.filter(m => m.status === 'finished');
    } else if (statusFilter && statusFilter !== 'all' && statusFilter !== 'everything') {
      matches = matches.filter(m => m.status === statusFilter);
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
    if (kpiGames) kpiGames.textContent = allTodayMatches.length + ' partidas';
    
    if (!container) return;

    if (matches.length === 0) {
      container.innerHTML = \`
        <div class="py-10 text-center text-slate-400 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 p-6">
          <i data-lucide="calendar-check" class="w-10 h-10 mx-auto mb-2 text-emerald-500"></i>
          <h4 class="text-sm font-bold text-slate-800">Nenhum jogo agendado com os filtros para esta data.</h4>
          <p class="text-xs text-slate-400 mt-1">Todos os campos estão livres para novas reservas ou manutenções.</p>
          <button type="button" onclick="openDirectBookingModal()" class="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow inline-flex items-center gap-1.5 transition cursor-pointer">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            <span>Nova Reserva Balcão</span>
          </button>
        </div>
      \`;
    } else {`;

const newRenderMatches = `  window.setMovementQuickFilter = function(status) {
    const statusEl = document.getElementById('movementStatusFilter');
    if (statusEl) {
      statusEl.value = status;
    }
    window.adminGameState.movementFilterStatus = status;
    renderMovementMatches();
  };

  function renderMovementMatches() {
    const dateStr = window.adminGameState.selectedDate || '2026-11-03';
    const container = document.getElementById('movementMatchesListContainer');
    const titleEl = document.getElementById('movementFeedTitle');
    const countEl = document.getElementById('movementFeedCount');

    // Recupera TODAS as partidas do dia para estatísticas completas
    const allMatches = getMatchesForDate(dateStr);
    const finishedCount = allMatches.filter(m => m.status === 'finished').length;
    const activeCount = allMatches.filter(m => m.status !== 'finished').length;
    const liveCount = allMatches.filter(m => m.status === 'live' || m.status === 'playing' || m.status === 'in_progress').length;

    // Atualiza contadores dos pills de filtro
    const pAct = document.getElementById('pillActiveCount');
    const pFin = document.getElementById('pillFinishedCount');
    const pLiv = document.getElementById('pillLiveCount');
    const pTot = document.getElementById('pillTotalCount');
    if (pAct) pAct.textContent = activeCount;
    if (pFin) pFin.textContent = finishedCount;
    if (pLiv) pLiv.textContent = liveCount;
    if (pTot) pTot.textContent = allMatches.length;

    // Filtros de Quadra e Status
    const courtFilter = window.adminGameState.movementFilterCourt || 'all';
    const statusFilter = window.adminGameState.movementFilterStatus || 'all';

    // Atualiza estado visual ativo dos botões pills
    const pillKeys = [
      { id: 'pillFilterActive', val: 'all' },
      { id: 'pillFilterFinished', val: 'finished' },
      { id: 'pillFilterLive', val: 'live' },
      { id: 'pillFilterEverything', val: 'everything' }
    ];
    pillKeys.forEach(p => {
      const btn = document.getElementById(p.id);
      if (!btn) return;
      const isActive = (p.val === statusFilter) || (p.val === 'all' && (!statusFilter || statusFilter === 'all'));
      if (isActive) {
        btn.className = 'px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 bg-emerald-600 text-white shadow-xs';
      } else {
        btn.className = 'px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200';
      }
    });

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
    if (kpiGames) kpiGames.textContent = allTodayMatches.length + ' partidas';
    
    if (!container) return;

    if (matches.length === 0) {
      if (statusFilter === 'finished') {
        container.innerHTML = \`
          <div class="py-10 text-center text-slate-400 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 p-6">
            <div class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-2xl font-bold">✓</div>
            <h4 class="text-sm font-bold text-slate-800">Nenhuma partida finalizada até o momento para \${formatDisplayDate(dateStr)}.</h4>
            <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">As partidas concluídas aparecerão aqui imediatamente após o encerramento do jogo e recebimento da bola.</p>
            <button type="button" onclick="setMovementQuickFilter('all')" class="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow inline-flex items-center gap-1.5 transition cursor-pointer">
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
              <span>Ver Partidas Ativas (\${activeCount})</span>
            </button>
          </div>
        \`;
      } else {
        container.innerHTML = \`
          <div class="py-10 text-center text-slate-400 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 p-6">
            <i data-lucide="calendar-check" class="w-10 h-10 mx-auto mb-2 text-emerald-500"></i>
            <h4 class="text-sm font-bold text-slate-800">\${finishedCount > 0 ? 'Todas as partidas ativas de ' + formatDisplayDate(dateStr) + ' foram concluídas!' : 'Nenhum jogo agendado com os filtros para esta data.'}</h4>
            <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">\${finishedCount > 0 ? 'Existem ' + finishedCount + ' partida(s) finalizada(s) registrada(s) para este dia.' : 'Todos os campos estão livres para novas reservas ou manutenções.'}</p>
            <div class="flex items-center justify-center gap-2 mt-4 flex-wrap">
              \${finishedCount > 0 ? \`
              <button type="button" onclick="setMovementQuickFilter('finished')" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow inline-flex items-center gap-1.5 transition cursor-pointer">
                <span>✅ Ver \${finishedCount} Partida(s) Finalizada(s)</span>
              </button>
              \` : ''}
              <button type="button" onclick="openDirectBookingModal()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow inline-flex items-center gap-1.5 transition cursor-pointer">
                <i data-lucide="plus-circle" class="w-4 h-4"></i>
                <span>Nova Reserva Balcão</span>
              </button>
            </div>
          </div>
        \`;
      }
    } else {`;

if (!html.includes(oldRenderMatches)) {
  console.error('Target oldRenderMatches not found!');
  process.exit(1);
}
html = html.replace(oldRenderMatches, newRenderMatches);
console.log('renderMovementMatches atualizada com sucesso.');

// 3. Atualizar initAdminGames para usar window.pullDataFromCloudDatabases
const oldInitCloudFetch = `    // Sincroniza em segundo plano com o Supabase oficial
    fetch('https://aukrcnhuyultkjqsgvea.supabase.co/rest/v1/bookings?select=*&order=date.desc', {
      headers: {
        'apikey': 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi',
        'Authorization': 'Bearer sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi'
      }
    }).then(res => res.json()).then(cloudBookings => {
      if (Array.isArray(cloudBookings) && cloudBookings.length > 0) {
        window.adminGameState.bookings = cloudBookings;
        localStorage.setItem('arena_local_bookings', JSON.stringify(cloudBookings));
        renderMovementMatches();
        renderCadastrosBookingsList();
      }
    }).catch(err => console.warn('Background sync note:', err));`;

const newInitCloudFetch = `    // Sincroniza em segundo plano com os 2 Bancos de Dados na Nuvem (Dual-Cloud)
    if (typeof window.pullDataFromCloudDatabases === 'function') {
      window.pullDataFromCloudDatabases();
    }`;

if (!html.includes(oldInitCloudFetch)) {
  console.error('Target oldInitCloudFetch not found!');
  process.exit(1);
}
html = html.replace(oldInitCloudFetch, newInitCloudFetch);
console.log('initAdminGames atualizado com sucesso.');

fs.writeFileSync(adminPath, html, 'utf8');
console.log('admin.html atualizado e gravado com sucesso.');
