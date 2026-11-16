const fs = require('fs');

const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Atualizar o bloco de filtros na tela de Movimentação para adicionar o seletor / carrossel de Espaços
const oldStatusFilterBlock = `          <!-- Filtro Status -->
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
                <option value="unpaid">⚠️ Pagamento Faltando</option>
              </select>
              <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            </div>
          </div>`;

const newCourtAndStatusFilterBlock = `          <!-- Filtro Status de Partidas -->
          <div class="flex items-center gap-2 w-full sm:w-auto flex-1 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 sm:py-1.5 transition shadow-2xs">
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
                <option value="unpaid">⚠️ Pagamento Faltando</option>
              </select>
              <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            </div>
          </div>

          <!-- Filtro Status / Seletor de Quadras & Campos -->
          <div class="flex items-center gap-2 w-full sm:w-auto flex-1 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 sm:py-1.5 transition shadow-2xs">
            <span class="text-[11px] sm:text-xs font-black uppercase text-slate-700 shrink-0 flex items-center gap-1 min-w-[65px]">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600"></i> Espaço:
            </span>
            <div class="relative flex-1 min-w-[140px]">
              <select id="movementCourtFilter" onchange="filterMovementMatches()" class="w-full py-1.5 sm:py-2 pl-2 pr-7 border-0 rounded-lg text-xs font-bold text-slate-800 bg-transparent focus:ring-2 focus:ring-emerald-600 truncate appearance-none cursor-pointer">
                <option value="all">🏟️ Todas as Quadras e Campos</option>
                <option value="fut5">⚽ FUT 5 – SOCCER 5</option>
                <option value="fut6">⚽ FUT 6 – SOCCER 6</option>
                <option value="fut7">⚽ FUT 7 – SOCCER 7</option>
                <option value="futmesa">🎯 FOOT TABLE – FUTMESA</option>
                <option value="areia">🏖️ AREIA – BEACH SPORTS</option>
                <option value="society">🏟️ SOCIETY – ARENA CENTRAL</option>
              </select>
              <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            </div>
          </div>

          <!-- Pílulas Rápidas de Quadras (Rolagem Horizontal para Mobile/Desktop) -->
          <div class="w-full pt-1">
            <div id="movementCourtPillsContainer" class="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar select-none text-xs">
              <button type="button" onclick="selectMovementCourtPill('all')" data-court-pill="all" class="court-pill-btn active-court-pill shrink-0 px-3 py-1.5 rounded-xl font-black text-xs transition-all shadow-xs flex items-center gap-1.5 bg-emerald-700 text-white border border-emerald-800 cursor-pointer">
                <span>🏟️ Todos</span>
              </button>
              <button type="button" onclick="selectMovementCourtPill('fut5')" data-court-pill="fut5" class="court-pill-btn shrink-0 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-2xs flex items-center gap-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 cursor-pointer">
                <span>⚽ FUT 5</span>
              </button>
              <button type="button" onclick="selectMovementCourtPill('fut6')" data-court-pill="fut6" class="court-pill-btn shrink-0 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-2xs flex items-center gap-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 cursor-pointer">
                <span>⚽ FUT 6</span>
              </button>
              <button type="button" onclick="selectMovementCourtPill('fut7')" data-court-pill="fut7" class="court-pill-btn shrink-0 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-2xs flex items-center gap-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 cursor-pointer">
                <span>⚽ FUT 7</span>
              </button>
              <button type="button" onclick="selectMovementCourtPill('futmesa')" data-court-pill="futmesa" class="court-pill-btn shrink-0 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-2xs flex items-center gap-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 cursor-pointer">
                <span>🎯 FUTMESA</span>
              </button>
              <button type="button" onclick="selectMovementCourtPill('areia')" data-court-pill="areia" class="court-pill-btn shrink-0 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-2xs flex items-center gap-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 cursor-pointer">
                <span>🏖️ AREIA</span>
              </button>
              <button type="button" onclick="selectMovementCourtPill('society')" data-court-pill="society" class="court-pill-btn shrink-0 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-2xs flex items-center gap-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 cursor-pointer">
                <span>🏟️ SOCIETY</span>
              </button>
            </div>
          </div>`;

if (!content.includes(oldStatusFilterBlock)) {
  console.error('Error: oldStatusFilterBlock not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldStatusFilterBlock, newCourtAndStatusFilterBlock);
console.log('1. Added Court Filter select and Interactive Court Pills: SUCCESS');

// 2. Adicionar função de controle selectMovementCourtPill e sincronização
const pillFunctionCode = `
  // Função para seleção rápida de quadras por pílulas / botões rolando
  window.selectMovementCourtPill = function(courtId) {
    const courtSelect = document.getElementById('movementCourtFilter');
    if (courtSelect) {
      courtSelect.value = courtId;
    }
    if (window.adminGameState) {
      window.adminGameState.movementFilterCourt = courtId;
    }

    // Atualiza estado visual das pílulas
    const pills = document.querySelectorAll('.court-pill-btn');
    pills.forEach(p => {
      if (p.getAttribute('data-court-pill') === courtId) {
        p.className = 'court-pill-btn active-court-pill shrink-0 px-3 py-1.5 rounded-xl font-black text-xs transition-all shadow-xs flex items-center gap-1.5 bg-emerald-700 text-white border border-emerald-800 cursor-pointer';
      } else {
        p.className = 'court-pill-btn shrink-0 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-2xs flex items-center gap-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 cursor-pointer';
      }
    });

    if (typeof renderMovementMatches === 'function') {
      renderMovementMatches();
    }
  };
`;

// Inserir antes de filterMovementMatches
const targetFilterMatches = 'window.filterMovementMatches = function() {';
if (!content.includes(targetFilterMatches)) {
  console.error('Error: targetFilterMatches not found!');
  process.exit(1);
}

const newFilterMatchesCode = `window.filterMovementMatches = function() {
    const courtEl = document.getElementById('movementCourtFilter');
    const statusEl = document.getElementById('movementStatusFilter');
    const cVal = courtEl ? courtEl.value : 'all';
    if (courtEl) window.adminGameState.movementFilterCourt = cVal;
    if (statusEl) window.adminGameState.movementFilterStatus = statusEl.value;

    // Sincroniza visual das pílulas de quadra
    const pills = document.querySelectorAll('.court-pill-btn');
    pills.forEach(p => {
      if (p.getAttribute('data-court-pill') === cVal) {
        p.className = 'court-pill-btn active-court-pill shrink-0 px-3 py-1.5 rounded-xl font-black text-xs transition-all shadow-xs flex items-center gap-1.5 bg-emerald-700 text-white border border-emerald-800 cursor-pointer';
      } else {
        p.className = 'court-pill-btn shrink-0 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-2xs flex items-center gap-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 cursor-pointer';
      }
    });

    renderMovementMatches();
  };`;

content = content.replace(targetFilterMatches, pillFunctionCode + '\n  ' + newFilterMatchesCode);
console.log('2. Injected selectMovementCourtPill and updated filterMovementMatches: SUCCESS');

// 3. Atualizar o Título do Feed para quando uma quadra específica estiver selecionada
const oldTitleUpdate = `    // Atualiza o Título do Feed de acordo com o tópico de status selecionado
    if (titleEl) {`;

const newTitleUpdate = `    // Atualiza o Título do Feed com indicação da Quadra / Espaço e Status
    if (titleEl) {
      let courtSuffix = '';
      if (courtFilter && courtFilter !== 'all') {
        const cObj = getCourtById(courtFilter);
        courtSuffix = ' • <span class="text-emerald-700 font-black">' + (cObj.name || courtFilter) + '</span>';
      }`;

content = content.replace(oldTitleUpdate, newTitleUpdate);

content = content.replace(
  "titleEl.textContent = 'Partidas Programadas para ' + formatDisplayDate(dateStr);",
  "titleEl.innerHTML = 'Partidas de ' + formatDisplayDate(dateStr) + courtSuffix;"
);
console.log('3. Updated Title with selected court information: SUCCESS');

fs.writeFileSync(path, content, 'utf8');
console.log('All changes applied successfully to admin.html!');
