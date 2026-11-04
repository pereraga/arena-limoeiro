const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let html = fs.readFileSync(adminPath, 'utf8');

// 1. Remover o bloco HTML de pills
const targetPillBlock = `          <!-- Atalhos Rápidos de Filtro por Status (Visibilidade Instantânea e Responsiva) -->
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
          </div>`;

if (!html.includes(targetPillBlock)) {
  console.error('targetPillBlock not found in admin.html');
  process.exit(1);
}

html = html.replace(targetPillBlock + '\n', '');
console.log('1. Bloco de pills HTML removido.');

// 2. Limpar manipulações de pills em renderMovementMatches
const oldPillLogic = `    // Atualiza contadores dos pills de filtro
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
    });`;

const newCleanLogic = `    // Filtros de Quadra e Status
    const courtFilter = window.adminGameState.movementFilterCourt || 'all';
    const statusFilter = window.adminGameState.movementFilterStatus || 'all';`;

if (!html.includes(oldPillLogic)) {
  console.error('oldPillLogic not found in admin.html');
  process.exit(1);
}

html = html.replace(oldPillLogic, newCleanLogic);
console.log('2. Lógica interna de pills em renderMovementMatches removida com sucesso.');

// 3. Atualizar botões de feedback no empty state para usar filterMovementMatches
html = html.replace("onclick=\"setMovementQuickFilter('all')\"", "onclick=\"document.getElementById('movementStatusFilter').value='all'; filterMovementMatches();\"");
html = html.replace("onclick=\"setMovementQuickFilter('finished')\"", "onclick=\"document.getElementById('movementStatusFilter').value='finished'; filterMovementMatches();\"");

fs.writeFileSync(adminPath, html, 'utf8');
console.log('3. admin.html salvo com sucesso.');
