const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

// Target navigation block
const targetNav = `      <!-- SUB-NAVEGAÇÃO INTERNA: QUADRAS & MODALIDADES (ESTILO OFICIAL DA ARENA) -->
      <!-- SUB-NAVEGAÇÃO COMPLETA: GESTÃO DE ESPAÇOS (Quadras, Categorias & Modalidades, Posições dos Jogos, Horários Fixos, Jogos) -->
      <div class="flex items-center justify-center w-full mb-3 px-2">
        <div class="p-2 sm:p-2.5 rounded-2xl bg-slate-100/80 border border-slate-200/90 w-full max-w-5xl shadow-2xs mx-auto">
          <!-- Grade Flexível: Em computadores/desktops (md e acima) fica em 1 fileira só linha reta (5 botões juntos) -->
          <!-- Em celulares pequenos (abaixo de md), divide em 2 fileiras organizadas -->
          <div class="flex flex-wrap md:flex-nowrap items-center justify-center gap-2 w-full">
            
            <!-- Fileira 1 (Mobile) / Botões 1, 2, 3 (Desktop) -->
            <div class="flex items-center justify-center gap-2 w-full md:w-auto md:contents">
              <button type="button" id="btnCourtsSub-quadras" onclick="switchCourtsSubTab('quadras')" class="tab-btn tab-active flex-1 md:flex-initial md:min-w-[130px] !h-[42px] px-3 sm:px-4 text-xs font-bold whitespace-nowrap">
                <i data-lucide="layout-grid" class="w-4 h-4 shrink-0 text-white"></i>
                <span>Quadras</span>
                <span class="badge-count shrink-0" id="badgeCourtsCount">6</span>
              </button>
              <button type="button" id="btnCourtsSub-modalidades" onclick="switchCourtsSubTab('modalidades')" class="tab-btn tab-inactive flex-1 md:flex-initial md:min-w-[150px] !h-[42px] px-3 sm:px-4 text-xs font-bold whitespace-nowrap">
                <i data-lucide="tag" class="w-4 h-4 shrink-0 text-slate-700"></i>
                <span>Modalidades</span>
                <span class="badge-count shrink-0" id="badgeModalitiesCount">4</span>
              </button>
              <button type="button" id="btnCourtsSub-posicoes" onclick="switchCourtsSubTab('posicoes')" class="tab-btn tab-inactive flex-1 md:flex-initial md:min-w-[165px] !h-[42px] px-3 sm:px-4 text-xs font-bold whitespace-nowrap">
                <i data-lucide="map-pin" class="w-4 h-4 shrink-0 text-slate-700"></i>
                <span>Posições dos Jogos</span>
              </button>
            </div>

            <!-- Fileira 2 (Mobile) / Botões 4, 5 (Desktop na mesma linha) -->
            <div class="flex items-center justify-center gap-2 w-full md:w-auto md:contents">
              <button type="button" id="btnCourtsSub-mensalistas" onclick="switchCourtsSubTab('mensalistas')" class="tab-btn tab-inactive flex-1 md:flex-initial md:min-w-[155px] !h-[42px] px-3 sm:px-4 text-xs font-bold whitespace-nowrap">
                <i data-lucide="calendar" class="w-4 h-4 shrink-0 text-slate-700"></i>
                <span>Horários Fixos</span>
                <span class="badge-count shrink-0" id="badgeCourtsMensalistasCount">40</span>
              </button>
              <button type="button" id="btnCourtsSub-jogos" onclick="switchCourtsSubTab('jogos')" class="tab-btn tab-inactive flex-1 md:flex-initial md:min-w-[125px] !h-[42px] px-3 sm:px-4 text-xs font-bold whitespace-nowrap">
                <span class="text-sm shrink-0">⚽</span>
                <span>Jogos</span>
                <span class="badge-count shrink-0" id="badgeCourtsJogosCount">0</span>
              </button>
            </div>

          </div>
        </div>
      </div>`;

const replacementNav = `      <!-- SUB-NAVEGAÇÃO INTERNA: QUADRAS & MODALIDADES (ESTILO OFICIAL DA ARENA) -->
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

if (content.includes(targetNav)) {
  content = content.replace(targetNav, replacementNav);
  fs.writeFileSync(adminPath, content, 'utf8');
  console.log('admin.html updated subtab navigation successfully!');
} else {
  console.error('targetNav not found in admin.html!');
}
