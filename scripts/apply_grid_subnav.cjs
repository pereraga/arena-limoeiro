const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

const targetSubnav = `      <!-- SUB-NAVEGAÇÃO INTERNA: QUADRAS & MODALIDADES (ESTILO OFICIAL DA ARENA) -->
      <!-- SUB-NAVEGAÇÃO COMPLETA: GESTÃO DE ESPAÇOS (Rolagem Suave no Mobile sem quebras feias, alinhado 100% no Desktop) -->
      <div class="w-full mb-3 px-1 sm:px-2">
        <div class="p-1.5 sm:p-2.5 rounded-2xl bg-slate-100/90 border border-slate-200 w-full max-w-5xl shadow-2xs mx-auto">
          <div class="flex items-center gap-2 w-full overflow-x-auto pb-1 sm:pb-0 no-scrollbar select-none md:justify-center">
            
            <button type="button" id="btnCourtsSub-quadras" onclick="switchCourtsSubTab('quadras')" class="tab-btn tab-active shrink-0 !h-[40px] px-3.5 sm:px-4 text-xs font-bold whitespace-nowrap">
              <i data-lucide="layout-grid" class="w-4 h-4 shrink-0 text-white"></i>
              <span>Quadras</span>
              <span class="badge-count shrink-0" id="badgeCourtsCount">6</span>
            </button>

            <button type="button" id="btnCourtsSub-modalidades" onclick="switchCourtsSubTab('modalidades')" class="tab-btn tab-inactive shrink-0 !h-[40px] px-3.5 sm:px-4 text-xs font-bold whitespace-nowrap">
              <i data-lucide="tag" class="w-4 h-4 shrink-0 text-slate-700"></i>
              <span>Modalidades</span>
              <span class="badge-count shrink-0" id="badgeModalitiesCount">4</span>
            </button>

            <button type="button" id="btnCourtsSub-posicoes" onclick="switchCourtsSubTab('posicoes')" class="tab-btn tab-inactive shrink-0 !h-[40px] px-3.5 sm:px-4 text-xs font-bold whitespace-nowrap">
              <i data-lucide="map-pin" class="w-4 h-4 shrink-0 text-slate-700"></i>
              <span>Posições dos Jogos</span>
            </button>

            <button type="button" id="btnCourtsSub-mensalistas" onclick="switchCourtsSubTab('mensalistas')" class="tab-btn tab-inactive shrink-0 !h-[40px] px-3.5 sm:px-4 text-xs font-bold whitespace-nowrap">
              <i data-lucide="calendar" class="w-4 h-4 shrink-0 text-slate-700"></i>
              <span>Horários Fixos</span>
              <span class="badge-count shrink-0" id="badgeCourtsMensalistasCount">40</span>
            </button>

            <button type="button" id="btnCourtsSub-jogos" onclick="switchCourtsSubTab('jogos')" class="tab-btn tab-inactive shrink-0 !h-[40px] px-3.5 sm:px-4 text-xs font-bold whitespace-nowrap">
              <span class="text-sm shrink-0">⚽</span>
              <span>Jogos</span>
              <span class="badge-count shrink-0" id="badgeCourtsJogosCount">0</span>
            </button>

          </div>
        </div>
      </div>`;

const replacementSubnav = `      <!-- SUB-NAVEGAÇÃO INTERNA: QUADRAS & MODALIDADES (ESTILO OFICIAL DA ARENA) -->
      <!-- SUB-NAVEGAÇÃO COMPLETA: GESTÃO DE ESPAÇOS (Grade em 2 ou 3 fileiras no Mobile para fácil clique, 1 linha no Desktop) -->
      <div class="w-full mb-4 px-1 sm:px-2">
        <div class="p-2 sm:p-2.5 rounded-2xl bg-slate-100/90 border border-slate-200 w-full max-w-5xl shadow-2xs mx-auto">
          <!-- Grade Responsiva: 2 colunas em telas pequenas (mobile), 3 colunas em telas médias e 5 colunas em desktop -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 w-full">
            
            <button type="button" id="btnCourtsSub-quadras" onclick="switchCourtsSubTab('quadras')" class="tab-btn tab-active !w-full !min-w-0 !h-[44px] px-2.5 sm:px-3 text-xs font-bold truncate">
              <i data-lucide="layout-grid" class="w-4 h-4 shrink-0 text-white"></i>
              <span class="truncate">Quadras</span>
              <span class="badge-count shrink-0" id="badgeCourtsCount">6</span>
            </button>

            <button type="button" id="btnCourtsSub-modalidades" onclick="switchCourtsSubTab('modalidades')" class="tab-btn tab-inactive !w-full !min-w-0 !h-[44px] px-2.5 sm:px-3 text-xs font-bold truncate">
              <i data-lucide="tag" class="w-4 h-4 shrink-0 text-slate-700"></i>
              <span class="truncate">Modalidades</span>
              <span class="badge-count shrink-0" id="badgeModalitiesCount">4</span>
            </button>

            <button type="button" id="btnCourtsSub-posicoes" onclick="switchCourtsSubTab('posicoes')" class="tab-btn tab-inactive !w-full !min-w-0 !h-[44px] px-2.5 sm:px-3 text-xs font-bold truncate col-span-2 sm:col-span-1">
              <i data-lucide="map-pin" class="w-4 h-4 shrink-0 text-slate-700"></i>
              <span class="truncate">Posições dos Jogos</span>
            </button>

            <button type="button" id="btnCourtsSub-mensalistas" onclick="switchCourtsSubTab('mensalistas')" class="tab-btn tab-inactive !w-full !min-w-0 !h-[44px] px-2.5 sm:px-3 text-xs font-bold truncate">
              <i data-lucide="calendar" class="w-4 h-4 shrink-0 text-slate-700"></i>
              <span class="truncate">Horários Fixos</span>
              <span class="badge-count shrink-0" id="badgeCourtsMensalistasCount">40</span>
            </button>

            <button type="button" id="btnCourtsSub-jogos" onclick="switchCourtsSubTab('jogos')" class="tab-btn tab-inactive !w-full !min-w-0 !h-[44px] px-2.5 sm:px-3 text-xs font-bold truncate">
              <span class="text-sm shrink-0">⚽</span>
              <span class="truncate">Jogos</span>
              <span class="badge-count shrink-0" id="badgeCourtsJogosCount">0</span>
            </button>

          </div>
        </div>
      </div>`;

if (content.includes(targetSubnav)) {
  content = content.replace(targetSubnav, replacementSubnav);
  fs.writeFileSync(adminPath, content, 'utf8');
  console.log('admin.html updated with responsive grid layout for subnav!');
} else {
  console.error('targetSubnav not found!');
}
