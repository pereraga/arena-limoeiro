const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

// 1. Add window.handleGameMainAction if not present
if (!content.includes('window.handleGameMainAction =')) {
  const mainActionFn = `
  window.handleGameMainAction = function(id) {
    const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
    if (!g) return;

    const st = g.status || 'confirmed';
    const isLive = (st === 'live' || st === 'playing' || st === 'in_progress');

    if (isLive) {
      if (typeof window.openFinishGame === 'function') {
        window.openFinishGame(id);
      }
    } else {
      g.status = 'live';
      g.attendance = 'Em Quadra';
      if (!Array.isArray(g.log)) g.log = [];
      const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      g.log.push({ at: 'Partida iniciada (' + nowTime + ')', text: 'Operador deu início à partida na quadra.' });

      // Transforma o botão imediatamente para Vermelho (Finalizar)
      const btn = document.getElementById('btn-main-action-' + id);
      if (btn) {
        btn.className = "w-full sm:w-auto px-6 py-2.5 rounded-full font-bold text-xs text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 shadow-md shadow-red-600/30 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 cursor-pointer";
        btn.innerHTML = '<i class="fa-solid fa-check text-[11px]"></i> Finalizar';
        btn.title = "Finalizar partida";
      }

      try {
        localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));
      } catch(e) {}
      if (typeof window.saveAdminGameState === 'function') window.saveAdminGameState();
      if (typeof window.syncBookingToCloud === 'function') window.syncBookingToCloud(g, 'upsert');
      if (typeof window.showNotification === 'function') {
        window.showNotification("Partida iniciada! O botão mudou para 'Finalizar'.");
      }

      if (typeof window.renderMovementMatches === 'function') {
        window.renderMovementMatches();
      }
    }
  };
`;
  content = content.replace('window.renderMatchCardHtml = renderMatchCardHtml;', mainActionFn + '\n  window.renderMatchCardHtml = renderMatchCardHtml;');
  console.log('Added window.handleGameMainAction.');
}

// 2. Now update renderMatchCardHtml:
// A) In top right: render green button when waiting, red button when live, finished badge when finished
// B) In secondary row: remove duplicate [Iniciar Jogo na Quadra] and [Finalizar], keeping ONLY [Editar jogo], [Editar contrato], [Não compareceu], [Cancelar partida]

const oldTopBtnPattern = `            <!-- BOTÃO PRINCIPAL VISÍVEL: FINALIZAR (VERMELHO) OU FINALIZADA + RECIBO -->
            <div class="w-full flex justify-end">
              \${st === 'finished' ? \`
                <div class="flex items-center gap-2">
                  <span class="px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 shadow-sm inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-circle-check text-emerald-600"></i> Finalizada
                  </span>
                  <button type="button" onclick="viewReceipt('\${m.id}')" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer inline-flex items-center gap-1" title="Ver Recibo">
                    <i class="fa-solid fa-receipt text-slate-500"></i> Recibo
                  </button>
                </div>
              \` : \`
                <button type="button" onclick="openFinishGame('\${m.id}')" class="w-full sm:w-auto px-6 py-2.5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 shadow-md shadow-red-600/30 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                  <i class="fa-solid fa-check text-[11px]"></i> Finalizar
                </button>
              \`}
            </div>`;

const newTopBtnPattern = `            <!-- BOTÃO PRINCIPAL VISÍVEL: VERDE PARA INICIAR -> APÓS APERTAR, FICA VERMELHO (FINALIZAR) -->
            <div class="w-full flex justify-end">
              \${st === 'finished' ? \`
                <div class="flex items-center gap-2">
                  <span class="px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 shadow-sm inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-circle-check text-emerald-600"></i> Finalizada
                  </span>
                  <button type="button" onclick="viewReceipt('\${m.id}')" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer inline-flex items-center gap-1" title="Ver Recibo">
                    <i class="fa-solid fa-receipt text-slate-500"></i> Recibo
                  </button>
                </div>
              \` : (isLive ? \`
                <button type="button" id="btn-main-action-\${m.id}" onclick="handleGameMainAction('\${m.id}')" title="Finalizar partida" class="w-full sm:w-auto px-6 py-2.5 rounded-full font-bold text-xs text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 shadow-md shadow-red-600/30 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                  <i class="fa-solid fa-check text-[11px]"></i> Finalizar
                </button>
              \` : \`
                <button type="button" id="btn-main-action-\${m.id}" onclick="handleGameMainAction('\${m.id}')" title="Iniciar jogo na quadra" class="w-full sm:w-auto px-6 py-2.5 rounded-full font-bold text-xs text-white bg-emerald-700 hover:bg-emerald-600 shadow-md shadow-emerald-700/25 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                  <i class="fa-solid fa-play text-[10px]"></i> Iniciar Jogo na Quadra
                </button>
              \`)}
            </div>`;

if (content.includes(oldTopBtnPattern)) {
  content = content.replace(oldTopBtnPattern, newTopBtnPattern);
  console.log('Replaced top button with green-to-red toggle pattern.');
} else {
  console.log('oldTopBtnPattern not found, inspecting top button in admin.html...');
}

// Ensure `const isLive = (st === 'live' || st === 'playing' || st === 'in_progress');` is present in renderMatchCardHtml
if (!content.includes('const isLive =')) {
  content = content.replace('const st = m.status || \'confirmed\';', 'const st = m.status || \'confirmed\';\n    const isLive = (st === \'live\' || st === \'playing\' || st === \'in_progress\');');
  console.log('Added const isLive definition.');
}

// 3. Update secondary actions row inside expanded panel to match image 2 (green underline):
const oldSecondaryRowPattern = `          <!-- BOTÕES DE GESTÃO SECUNDÁRIA -->
          <div class="flex flex-wrap items-center justify-between gap-2.5 pb-3">
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" onclick="openEditGame('\${m.id}')" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-pencil text-slate-400"></i> Editar jogo
              </button>

              <button type="button" onclick="openContract('\${m.id}')" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-file-contract text-slate-400"></i> Editar contrato
              </button>

              \${st !== 'finished' ? \`
              <button type="button" onclick="startGameNow('\${m.id}')" class="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-play text-emerald-600"></i> Iniciar Jogo na Quadra
              </button>
              <button type="button" onclick="openFinishGame('\${m.id}')" class="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-check text-emerald-600"></i> Finalizar
              </button>
              \` : ''}
            </div>

            <div class="flex items-center gap-2">
              <button type="button" onclick="openNoShow('\${m.id}')" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-user-slash text-amber-500"></i> Não compareceu
              </button>

              <button type="button" onclick="cancelGame('\${m.id}')" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-ban text-rose-500"></i> Cancelar partida
              </button>
            </div>
          </div>`;

const newSecondaryRowPattern = `          <!-- BOTÕES DE GESTÃO SECUNDÁRIA (EXATAMENTE COMO NA FOTO GRUPO VERDE) -->
          <div class="flex flex-wrap items-center justify-between gap-2.5 pb-3">
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" onclick="openEditGame('\${m.id}')" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-pencil text-slate-400"></i> Editar jogo
              </button>

              <button type="button" onclick="openContract('\${m.id}')" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-file-contract text-slate-400"></i> Editar contrato
              </button>
            </div>

            <div class="flex items-center gap-2">
              <button type="button" onclick="openNoShow('\${m.id}')" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-user-slash text-amber-500"></i> Não compareceu
              </button>

              <button type="button" onclick="cancelGame('\${m.id}')" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-ban text-rose-500"></i> Cancelar partida
              </button>
            </div>
          </div>`;

if (content.includes(oldSecondaryRowPattern)) {
  content = content.replace(oldSecondaryRowPattern, newSecondaryRowPattern);
  console.log('Updated secondary actions row to match image 2 exactly.');
} else {
  console.log('oldSecondaryRowPattern not found, checking snippet...');
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('Saved public/admin.html.');
