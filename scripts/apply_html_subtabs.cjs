const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let html = fs.readFileSync(path, 'utf8');

// 1. Locate the sub-nav bar in panel-courts
const oldNav = `<div class="flex items-center gap-2 mb-2 p-1.5 rounded-2xl bg-slate-100/80 border border-slate-200/90 w-fit max-w-full shadow-2xs">
        <button type="button" id="btnCourtsSub-quadras" onclick="switchCourtsSubTab('quadras')" class="tab-btn tab-active !flex-initial" style="min-width: 140px; height: 38px;">
          <i data-lucide="layout-grid" class="w-4 h-4 shrink-0 text-white"></i>
          <span>Quadras</span>
          <span class="badge-count" id="badgeCourtsCount">6</span>
        </button>
        <button type="button" id="btnCourtsSub-modalidades" onclick="switchCourtsSubTab('modalidades')" class="tab-btn tab-inactive !flex-initial" style="min-width: 145px; height: 38px;">
          <i data-lucide="tag" class="w-4 h-4 shrink-0 text-slate-700"></i>
          <span>Modalidades</span>
          <span class="badge-count" id="badgeModalitiesCount">4</span>
        </button>
      </div>`;

const newNav = `<!-- SUB-NAVEGAÇÃO COMPLETA: GESTÃO DE ESPAÇOS (Quadras, Categorias & Modalidades, Posições dos Jogos, Horários Fixos, Jogos) -->
      <div class="flex items-center gap-2 mb-2 p-1.5 rounded-2xl bg-slate-100/80 border border-slate-200/90 w-full overflow-x-auto scrollbar-none shadow-2xs flex-nowrap">
        <button type="button" id="btnCourtsSub-quadras" onclick="switchCourtsSubTab('quadras')" class="tab-btn tab-active !flex-initial shrink-0" style="min-width: 135px; height: 38px;">
          <i data-lucide="layout-grid" class="w-4 h-4 shrink-0 text-white"></i>
          <span>Quadras</span>
          <span class="badge-count" id="badgeCourtsCount">6</span>
        </button>
        <button type="button" id="btnCourtsSub-modalidades" onclick="switchCourtsSubTab('modalidades')" class="tab-btn tab-inactive !flex-initial shrink-0" style="min-width: 190px; height: 38px;">
          <i data-lucide="tag" class="w-4 h-4 shrink-0 text-slate-700"></i>
          <span>Categorias & Modalidades</span>
          <span class="badge-count" id="badgeModalitiesCount">4</span>
        </button>
        <button type="button" id="btnCourtsSub-posicoes" onclick="switchCourtsSubTab('posicoes')" class="tab-btn tab-inactive !flex-initial shrink-0" style="min-width: 165px; height: 38px;">
          <i data-lucide="map-pin" class="w-4 h-4 shrink-0 text-slate-700"></i>
          <span>Posições dos Jogos</span>
        </button>
        <button type="button" id="btnCourtsSub-mensalistas" onclick="switchCourtsSubTab('mensalistas')" class="tab-btn tab-inactive !flex-initial shrink-0" style="min-width: 160px; height: 38px;">
          <i data-lucide="calendar" class="w-4 h-4 shrink-0 text-slate-700"></i>
          <span>Horários Fixos</span>
          <span class="badge-count" id="badgeCourtsMensalistasCount">40</span>
        </button>
        <button type="button" id="btnCourtsSub-jogos" onclick="switchCourtsSubTab('jogos')" class="tab-btn tab-inactive !flex-initial shrink-0" style="min-width: 135px; height: 38px;">
          <span class="text-sm">⚽</span>
          <span>Jogos</span>
          <span class="badge-count" id="badgeCourtsJogosCount">0</span>
        </button>
      </div>`;

if (!html.includes(oldNav)) {
  console.error('Could not find oldNav in admin.html!');
  process.exit(1);
}
html = html.replace(oldNav, newNav);

// 2. Add subtab containers inside panel-courts right after courtsSubtab-modalidades
const targetAfterModalidades = `      <div class="footer-note">
        <b>Conexão Nuvem Ativa:</b> todas as alterações são salvas e sincronizadas em tempo real diretamente nos Bancos de Dados Supabase (DB1 e DB2).
      </div>
      </div>

    </section>`;

const newSubtabContainers = `      <div class="footer-note">
        <b>Conexão Nuvem Ativa:</b> todas as alterações são salvas e sincronizadas em tempo real diretamente nos Bancos de Dados Supabase (DB1 e DB2).
      </div>
      </div>

      <!-- SUB-ABA 3: POSIÇÕES DOS JOGOS (ORDENAÇÃO E VISUALIZAÇÃO DOS ESPAÇOS) -->
      <div id="courtsSubtab-posicoes" class="space-y-6 hidden">
        <div class="crumb"><span>Início</span><span>›</span><span>Gestão de Espaços</span><span>›</span><b>Posições dos Jogos</b></div>

        <section class="intro">
          <div>
            <p class="eyebrow">Organização e Grid Visual</p>
            <h1>Posições dos Jogos & Quadras</h1>
            <p>Ajuste a ordem de exibição das quadras na grade de horários, no monitor ao vivo e no aplicativo do cliente.</p>
          </div>
          <div class="intro-actions">
            <button class="btn btn-primary" type="button" onclick="saveCourtPositions()">💾 Salvar nova ordenação</button>
          </div>
        </section>

        <!-- Grade interativa de posições -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-black text-slate-900">Ordem de Exibição das Quadras</h3>
              <p class="text-xs text-slate-500">Suba ou desça as posições para reordenar a sequência no agendamento e nas colunas da Arena.</p>
            </div>
            <span class="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-black" id="badgePositionsCount">6 quadras ativas</span>
          </div>

          <div id="courtPositionsListContainer" class="space-y-2.5 pt-2">
            <!-- Renderizado dinamicamente via renderCourtPositions() -->
          </div>
        </div>
      </div>

      <!-- SUB-ABA 4: HORÁRIOS FIXOS & MENSALISTAS -->
      <div id="courtsSubtab-mensalistas" class="space-y-6 hidden">
        <div class="crumb"><span>Início</span><span>›</span><span>Gestão de Espaços</span><span>›</span><b>Horários Fixos</b></div>

        <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div class="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Gestão de Mensalistas & Contratos</div>
              <h3 class="text-xl font-black text-slate-900">Horários Fixos (Mensalistas)</h3>
              <p class="text-xs text-slate-500">Grade reservada semanalmente com garantia de horário e renovação recorrente.</p>
            </div>
            <div class="flex items-center gap-2">
              <span id="badgeCourtsTotalMensalistas" class="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-black">40 horários fixos</span>
              <button onclick="openDirectBookingModal()" class="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center gap-1.5 shadow transition cursor-pointer">
                <i data-lucide="plus" class="w-4 h-4"></i>
                <span>Novo Mensalista</span>
              </button>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div class="relative flex-1">
              <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
              <input type="text" id="courtsMensalistasSearchInput" oninput="renderCourtsMensalistasTable()" placeholder="Buscar por responsável, equipe, telefone ou quadra..." class="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-hidden">
            </div>
            <select id="courtsMensalistasDayFilter" onchange="renderCourtsMensalistasTable()" class="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 bg-white">
              <option value="all">📅 Todos os Dias da Semana</option>
              <option value="segunda">Segunda-feira</option>
              <option value="terca">Terça-feira</option>
              <option value="quarta">Quarta-feira</option>
              <option value="quinta">Quinta-feira</option>
              <option value="sexta">Sexta-feira</option>
              <option value="sabado">Sábado</option>
              <option value="domingo">Domingo</option>
            </select>
          </div>

          <div id="courtsMensalistasTableContainer" class="overflow-x-auto rounded-2xl border border-slate-100">
            <!-- Tabela renderizada dinamicamente -->
          </div>
        </div>
      </div>

      <!-- SUB-ABA 5: JOGOS & AGENDAMENTOS -->
      <div id="courtsSubtab-jogos" class="space-y-6 hidden">
        <div class="crumb"><span>Início</span><span>›</span><span>Gestão de Espaços</span><span>›</span><b>Jogos</b></div>

        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center space-x-3.5">
              <div class="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shrink-0">
                <i data-lucide="calendar-check" class="w-6 h-6 text-emerald-300"></i>
              </div>
              <div>
                <div class="flex items-center space-x-2">
                  <span class="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">Gestão de Jogos</span>
                  <span id="courtsJogosTotalBadge" class="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-full">0 partidas registradas</span>
                </div>
                <h3 class="text-xl font-black text-slate-900 mt-1">Todos os Agendamentos & Jogos Marcados</h3>
                <p class="text-xs text-slate-500">Visualize todas as reservas da arena nos espaços, pesquise por cliente ou quadra.</p>
              </div>
            </div>

            <div class="w-full sm:w-auto flex items-center justify-center">
              <button onclick="openDirectBookingModal()" title="Fazer Nova Reserva Direta" class="w-full sm:w-auto justify-center text-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow flex items-center space-x-1.5 transition-all cursor-pointer">
                <i data-lucide="plus" class="w-4 h-4 text-emerald-200 shrink-0"></i>
                <span>+ Nova Reserva Balcão</span>
              </button>
            </div>
          </div>

          <!-- Filtros de Busca e Quadra -->
          <div class="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4 mt-6 space-y-3">
            <div class="flex flex-col md:flex-row items-center justify-between gap-3">
              <div class="relative w-full md:w-96">
                <input type="text" id="courtsBookingSearchInput" oninput="renderCourtsBookingsTable()" placeholder="Buscar por cliente, telefone, CPF ou quadra..."
                       class="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-600 focus:outline-none transition-all">
                <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
              </div>

              <div class="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
                <select id="courtsBookingCourtFilter" onchange="renderCourtsBookingsTable()" class="p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer">
                  <option value="all">🏟️ Todas as Quadras</option>
                  <option value="fut5">FUT 5 – SOCCER 5</option>
                  <option value="fut6">FUT 6 – SOCCER 6</option>
                  <option value="fut7">FUT 7 – SOCCER 7</option>
                  <option value="futmesa">FOOT TABLE – FUTMESA</option>
                  <option value="areia">AREIA – BEACH SPORTS</option>
                  <option value="society">SOCIETY – ARENA CENTRAL</option>
                </select>

                <select id="courtsBookingStatusFilter" onchange="renderCourtsBookingsTable()" class="p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer">
                  <option value="all">Todos os Status</option>
                  <option value="upcoming">🔵 Agendados</option>
                  <option value="live">🟢 Em Andamento</option>
                  <option value="finished">✅ Finalizados</option>
                  <option value="cancelled">❌ Cancelados</option>
                </select>
              </div>
            </div>

            <div id="courtsBookingsListContainer" class="space-y-3 pt-2">
              <!-- Renderizado dinamicamente -->
            </div>
          </div>
        </div>
      </div>

    </section>`;

if (!html.includes(targetAfterModalidades)) {
  console.error('Could not find targetAfterModalidades in admin.html!');
  process.exit(1);
}
html = html.replace(targetAfterModalidades, newSubtabContainers);

fs.writeFileSync(path, html, 'utf8');
console.log('Successfully updated HTML structure in admin.html!');
