const fs = require('fs');

const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let content = fs.readFileSync(path, 'utf8');

// 1. balcaoHideOccupiedToggle: desmarcar por padrão (remover checked se ainda tiver)
const oldToggle = 'id="balcaoHideOccupiedToggle" onchange="renderBalcaoTimeSlots()" checked class="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer">';
const newToggle = 'id="balcaoHideOccupiedToggle" onchange="renderBalcaoTimeSlots()" class="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer">';

if (content.includes(oldToggle)) {
  content = content.replace(oldToggle, newToggle);
  console.log('1. Unchecked balcaoHideOccupiedToggle: SUCCESS');
} else {
  console.log('1. balcaoHideOccupiedToggle already unchecked.');
}

// 2. Inserir balcaoScheduledGamesContainer antes de directBookingSlotsGrid
const targetGridStart = '<div id="directBookingSlotsGrid" class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-1.5 max-h-64 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">';

const gamesContainerHtml = `<!-- Lista de Jogos e Mensalistas Agendados nesta Quadra -->
        <div id="balcaoScheduledGamesContainer" class="p-3 bg-rose-50/90 border border-rose-200 rounded-xl space-y-1.5">
          <div class="flex items-center justify-between text-xs font-bold text-rose-900">
            <span class="flex items-center gap-1.5"><i data-lucide="users" class="w-3.5 h-3.5 text-rose-600"></i> Agendamentos / Fixos nesta Quadra:</span>
            <span id="balcaoScheduledGamesCount" class="text-[10px] bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full font-black">0 agendados</span>
          </div>
          <div id="balcaoScheduledGamesList" class="flex flex-wrap gap-1.5 text-xs"></div>
        </div>

        <div id="directBookingSlotsGrid" class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-1.5 max-h-64 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">`;

if (!content.includes('id="balcaoScheduledGamesContainer"')) {
  if (!content.includes(targetGridStart)) {
    console.error('Error: targetGridStart not found in admin.html!');
    process.exit(1);
  }
  content = content.replace(targetGridStart, gamesContainerHtml);
  console.log('2. Inserted balcaoScheduledGamesContainer: SUCCESS');
} else {
  console.log('2. balcaoScheduledGamesContainer already present.');
}

// 3. Atualizar openDirectBookingModal para sincronizar a quadra ativa e desmarcar o toggle
const oldOpenFunc = `    if (dateInput) {
      const realTodayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : new Date().toISOString().split('T')[0];
      dateInput.value = window.adminGameState?.selectedDate || realTodayStr;
    }

    // Modal abre completamente LIMPO: nenhum bloco pré-selecionado pelo sistema
    if (startSelect) startSelect.value = '';
    if (endSelect) endSelect.value = '';`;

const newOpenFunc = `    if (dateInput) {
      const realTodayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : new Date().toISOString().split('T')[0];
      dateInput.value = window.adminGameState?.selectedDate || realTodayStr;
    }

    // Sincroniza a quadra com a quadra atualmente visualizada no painel administrativo
    if (courtSelect && window.adminGameState) {
      const activeCourt = window.adminGameState.selectedCourt;
      if (activeCourt && activeCourt !== 'all') {
        courtSelect.value = activeCourt;
      }
    }

    // Garante que o checkbox de ocultar ocupados comece desmarcado para mostrar os fixos e ocupados em vermelho
    const hideToggleEl = document.getElementById('balcaoHideOccupiedToggle');
    if (hideToggleEl) hideToggleEl.checked = false;

    // Modal abre completamente LIMPO: nenhum bloco pré-selecionado pelo sistema
    if (startSelect) startSelect.value = '';
    if (endSelect) endSelect.value = '';`;

if (content.includes(oldOpenFunc)) {
  content = content.replace(oldOpenFunc, newOpenFunc);
  console.log('3. Updated openDirectBookingModal: SUCCESS');
} else {
  console.log('3. openDirectBookingModal already updated or different snippet.');
}

// 4. Melhorar o visual dos botões ocupados em renderBalcaoTimeSlots
const oldOccupiedBtn = `        html += '<button type="button" data-slot-min="' + m + '" onclick="window.showBalcaoOccupiedDetail(\\'' + safeNomeJson + '\\', \\'' + slotTime + '\\', \\'' + safeHorarioJson + '\\', \\'' + safeTipoJson + '\\')" title="Agendado: ' + agendadoPorCompleto + ' (' + tipoLabel + ') [' + conflict.startStr + ' às ' + conflict.endStr + '] - Toque para ver detalhes" class="p-2 rounded-xl text-[11px] font-bold bg-rose-50/95 text-rose-900 border-2 border-rose-300 shadow-2xs cursor-pointer opacity-95 text-center flex flex-col items-center justify-center select-none hover:bg-rose-100 hover:border-rose-400 active:scale-95 transition-all">';
        html += '<span class="font-black text-rose-950">' + slotTime + '</span>';
        html += '<span class="balcao-slot-badge text-[10px] font-extrabold uppercase tracking-tight text-rose-700 bg-rose-200/90 px-1 py-0.5 rounded truncate max-w-[72px] w-full block shadow-3xs" title="' + agendadoPorCompleto + '">' + nomeExibicao + '</span>';
        html += '</button>';`;

const newOccupiedBtn = `        const intervalStr = conflict.startStr + ' às ' + conflict.endStr;
        html += '<button type="button" data-slot-min="' + m + '" onclick="window.showBalcaoOccupiedDetail(\\'' + safeNomeJson + '\\', \\'' + slotTime + '\\', \\'' + safeHorarioJson + '\\', \\'' + safeTipoJson + '\\')" title="Agendado: ' + agendadoPorCompleto + ' (' + tipoLabel + ') [' + intervalStr + '] - Toque para ver detalhes" class="p-1.5 sm:p-2 rounded-xl text-[11px] font-bold bg-rose-100 text-rose-950 border-2 border-rose-500 shadow-xs cursor-pointer text-center flex flex-col items-center justify-center select-none hover:bg-rose-200 hover:border-rose-600 active:scale-95 transition-all">';
        html += '<span class="font-black text-rose-950 text-xs">' + slotTime + '</span>';
        html += '<span class="balcao-slot-badge text-[9.5px] font-black uppercase tracking-tight text-rose-900 bg-rose-200 px-1 py-0.5 rounded truncate max-w-full w-full block shadow-3xs" title="' + agendadoPorCompleto + ' (' + intervalStr + ')">' + nomeExibicao + '</span>';
        html += '<span class="text-[8px] font-bold text-rose-700 leading-tight block">' + intervalStr + '</span>';
        html += '</button>';`;

if (content.includes(oldOccupiedBtn)) {
  content = content.replace(oldOccupiedBtn, newOccupiedBtn);
  console.log('4. Updated occupied button appearance: SUCCESS');
} else {
  console.log('4. Occupied button appearance already updated or not found.');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Finished processing admin.html.');
