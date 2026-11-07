const fs = require('fs');
const path = require('path');

const adminHtmlPath = path.join(__dirname, '..', 'public', 'admin.html');
let html = fs.readFileSync(adminHtmlPath, 'utf8');

console.log('1. Adding instant touch / click CSS rules...');
const touchCss = `    /* OTIMIZAÇÃO CRÍTICA DE CLIQUES E TOQUE INSTANTÂNEO (0MS DELAY) */
    button, [role="button"], #directBookingSlotsGrid button {
      touch-action: manipulation !important;
      -webkit-tap-highlight-color: transparent !important;
    }
    #directBookingSlotsGrid {
      touch-action: manipulation !important;
      -webkit-tap-highlight-color: transparent !important;
    }
    #directBookingSlotsGrid button {
      user-select: none !important;
      -webkit-user-select: none !important;
    }`;

if (!html.includes('OTIMIZAÇÃO CRÍTICA DE CLIQUES')) {
  html = html.replace('body { font-family: \'Inter\', sans-serif; }', `body { font-family: 'Inter', sans-serif; }\n${touchCss}`);
  console.log('  -> Touch CSS added successfully');
}

console.log('2. Replacing renderBalcaoTimeSlots with ultra-fast in-place updater...');

const startMarker = '// GESTÃO DE JANELAS DE HORAS (30 EM 30 MIN) PARA RESERVA DIRETA DE BALCÃO';
const endMarker = '  // Helper global para coletar ocupados da quadra/data do modal';

const startIdx = html.indexOf(startMarker);
const endIdx = html.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found! start:', startIdx, 'end:', endIdx);
  process.exit(1);
}

const newRenderCode = [
  '// GESTÃO DE JANELAS DE HORAS (30 EM 30 MIN) PARA RESERVA DIRETA DE BALCÃO',
  '  // Otimização de Alta Performance: Atualização in-place sem destruição do DOM (0ms delay)',
  '  window.__balcaoSelectionHistory = [];',
  '',
  '  window.renderBalcaoTimeSlots = function(forceRebuild) {',
  '    const grid = document.getElementById(\'directBookingSlotsGrid\');',
  '    if (!grid) return;',
  '',
  '    const courtSelect = document.getElementById(\'directBookingCourt\');',
  '    const dateInput = document.getElementById(\'directBookingDate\');',
  '    const startSelect = document.getElementById(\'directBookingStart\');',
  '    const endSelect = document.getElementById(\'directBookingEnd\');',
  '    const hideToggle = document.getElementById(\'balcaoHideOccupiedToggle\');',
  '    const gamesListEl = document.getElementById(\'balcaoScheduledGamesList\');',
  '    const gamesCountEl = document.getElementById(\'balcaoScheduledGamesCount\');',
  '    const nextAlertEl = document.getElementById(\'balcaoNextGameAlert\');',
  '    const nextAlertText = document.getElementById(\'balcaoNextGameAlertText\');',
  '',
  '    const courtId = courtSelect ? courtSelect.value : \'fut7\';',
  '    const dateStr = dateInput ? dateInput.value : (window.adminGameState.selectedDate || \'2026-11-04\');',
  '    const currentStart = startSelect ? startSelect.value : \'19:00\';',
  '    const currentEnd = endSelect ? endSelect.value : \'20:00\';',
  '    const shouldHideOccupied = hideToggle ? hideToggle.checked : true;',
  '',
  '    const currentStartMin = parseTimeToMinutes(currentStart);',
  '    const currentEndMin = parseTimeToMinutes(currentEnd);',
  '',
  '    const filterKey = courtId + \'_\' + dateStr + \'_\' + (shouldHideOccupied ? \'1\' : \'0\');',
  '',
  '    // 1. CAMINHO ULTRA-RÁPIDO: Atualização in-place dos botões existentes (0ms delay, sem reconstruir DOM)',
  '    if (!forceRebuild && grid.dataset.filterKey === filterKey && grid.children.length > 0) {',
  '      const slotButtons = grid.querySelectorAll(\'button[data-slot-min]\');',
  '      if (slotButtons.length > 0) {',
  '        slotButtons.forEach(btn => {',
  '          if (btn.disabled) return;',
  '          const m = parseInt(btn.dataset.slotMin, 10);',
  '          const slotEndMin = m + 30;',
  '          const isSelected = (m >= currentStartMin && slotEndMin <= currentEndMin);',
  '          const badgeSpan = btn.querySelector(\'.balcao-slot-badge\');',
  '',
  '          if (isSelected) {',
  '            const isStart = (m === currentStartMin);',
  '            const isEnd = (slotEndMin === currentEndMin);',
  '            const badgeLabel = isStart ? \'Início\' : (isEnd ? \'Fim\' : \'✓ Selec.\');',
  '            btn.className = \'p-2 rounded-xl text-[11px] font-black bg-emerald-600 text-white border-2 border-emerald-700 shadow-md transform scale-[1.03] cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75\';',
  '            if (badgeSpan) {',
  '              badgeSpan.className = \'balcao-slot-badge text-[9px] uppercase tracking-tighter text-emerald-100 font-bold\';',
  '              badgeSpan.textContent = badgeLabel;',
  '            }',
  '          } else {',
  '            btn.className = \'p-2 rounded-xl text-[11px] font-bold bg-emerald-50/70 hover:bg-emerald-100/90 text-emerald-800 border border-emerald-300 hover:border-emerald-500 cursor-pointer text-center flex flex-col items-center justify-center hover:scale-[1.02] select-none active:scale-95 transition-transform duration-75\';',
  '            if (badgeSpan) {',
  '              badgeSpan.className = \'balcao-slot-badge text-[9px] uppercase tracking-tighter text-emerald-600 font-semibold\';',
  '              badgeSpan.textContent = \'Livre\';',
  '            }',
  '          }',
  '        });',
  '',
  '        // Atualiza aviso de próximo jogo se necessário',
  '        if (nextAlertEl && nextAlertText) {',
  '          const occupiedRanges = window.getBalcaoOccupiedRanges(courtId, dateStr);',
  '          const nextGame = occupiedRanges.find(r => r.start > currentStartMin);',
  '          if (nextGame) {',
  '            nextAlertEl.style.display = \'flex\';',
  '            nextAlertText.innerHTML = \'<div class="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2"><span>⚠️ A partir das <strong>\' + nextGame.startStr + \'</strong> tem agendamento de <strong>\' + nextGame.name + \'</strong> (\' + nextGame.type + \'). Livre livremente até às <strong>\' + nextGame.startStr + \'</strong>.</span><button type="button" onclick="selectBalcaoUntilNextGame()" class="px-2.5 py-1 bg-sky-700 hover:bg-sky-800 text-white font-extrabold text-[11px] rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition shrink-0"><i data-lucide="zap" class="w-3.5 h-3.5 text-amber-300"></i> Preencher até às \' + nextGame.startStr + \'</button></div>\';',
  '          } else {',
  '            nextAlertEl.style.display = \'none\';',
  '          }',
  '        }',
  '',
  '        updateBalcaoSelectionSummary();',
  '        return;',
  '      }',
  '    }',
  '',
  '    // 2. CONSTRUÇÃO COMPLETA DA GRADE (Apenas quando a quadra, data ou filtro mudarem)',
  '    grid.dataset.filterKey = filterKey;',
  '',
  '    // Checar se a data selecionada é hoje',
  '    const todayStr = window.adminGameState.selectedDate || \'2026-11-04\';',
  '    const isToday = (dateStr === todayStr);',
  '',
  '    // Coletar intervalos ocupados no dia para esta quadra',
  '    const occupiedRanges = window.getBalcaoOccupiedRanges(courtId, dateStr);',
  '',
  '    // Atualiza o Card Informativo de Jogos Agendados',
  '    if (gamesListEl) {',
  '      if (occupiedRanges.length === 0) {',
  '        gamesListEl.innerHTML = \'<span class="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">✨ Nenhum jogo agendado nesta quadra neste dia. Todos os horários estão livres!</span>\';',
  '        if (gamesCountEl) gamesCountEl.textContent = \'0 agendados\';',
  '      } else {',
  '        if (gamesCountEl) gamesCountEl.textContent = occupiedRanges.length + (occupiedRanges.length === 1 ? \' agendado\' : \' agendados\');',
  '        let listHtml = \'\';',
  '        occupiedRanges.forEach(g => {',
  '          listHtml += \'<span class="inline-flex items-center gap-1 bg-amber-100/90 text-amber-950 font-extrabold px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs">\';',
  '          listHtml += \'🕒 \' + g.startStr + \' às \' + g.endStr + \' — <strong class="text-amber-900">\' + g.name + \'</strong> (\' + g.type + \')\';',
  '          listHtml += \'</span>\';',
  '        });',
  '        gamesListEl.innerHTML = listHtml;',
  '      }',
  '    }',
  '',
  '    let html = \'\';',
  '    let visibleSlotsCount = 0;',
  '',
  '    for (let m = 6 * 60; m <= 23 * 60; m += 30) {',
  '      const slotTime = formatMinutesToTime(m);',
  '      const slotNextTime = formatMinutesToTime(m + 30);',
  '      const slotEndMin = m + 30;',
  '',
  '      // Verifica se o slot está em conflito com algum jogo já agendado',
  '      const conflict = occupiedRanges.find(r => Math.max(m, r.start) < Math.min(slotEndMin, r.end));',
  '      const isOccupied = !!conflict;',
  '      ',
  '      // Checa se o horário já passou hoje',
  '      const isPast = (isToday && m < (11 * 60)); // horários passados hoje',
  '      const isUnavailable = isOccupied || isPast;',
  '',
  '      // Se o filtro de ocultar indisponíveis estiver ativado, esconde',
  '      if (shouldHideOccupied && isUnavailable) {',
  '        continue;',
  '      }',
  '',
  '      visibleSlotsCount++;',
  '      const isSelected = (!isUnavailable && m >= currentStartMin && slotEndMin <= currentEndMin);',
  '',
  '      if (isOccupied) {',
  '        html += \'<button type="button" disabled data-slot-min="\' + m + \'" title="Ocupado: \' + conflict.name + \' (\' + conflict.startStr + \' às \' + conflict.endStr + \')" class="p-2 rounded-xl text-[11px] font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60 line-through text-center flex flex-col items-center justify-center select-none">\';',
  '        html += \'<span class="font-bold">\' + slotTime + \'</span>\';',
  '        html += \'<span class="balcao-slot-badge text-[9px] uppercase tracking-tighter truncate max-w-[55px]">\' + conflict.name + \'</span>\';',
  '        html += \'</button>\';',
  '      } else if (isPast) {',
  '        html += \'<button type="button" disabled data-slot-min="\' + m + \'" title="Horário já passado" class="p-2 rounded-xl text-[11px] font-semibold bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed opacity-50 text-center flex flex-col items-center justify-center select-none">\';',
  '        html += \'<span class="font-bold">\' + slotTime + \'</span>\';',
  '        html += \'<span class="balcao-slot-badge text-[9px] uppercase tracking-tighter">Passado</span>\';',
  '        html += \'</button>\';',
  '      } else if (isSelected) {',
  '        const isStart = (m === currentStartMin);',
  '        const isEnd = (slotEndMin === currentEndMin);',
  '        const badgeLabel = isStart ? \'Início\' : (isEnd ? \'Fim\' : \'✓ Selec.\');',
  '        html += \'<button type="button" data-slot-min="\' + m + \'" data-slot-time="\' + slotTime + \'" onclick="toggleBalcaoTimeSlot(\\\'\' + slotTime + \'\\\')" title="Selecionado (\' + slotTime + \' às \' + slotNextTime + \') - Toque para alterar ou ajustar" class="p-2 rounded-xl text-[11px] font-black bg-emerald-600 text-white border-2 border-emerald-700 shadow-md transform scale-[1.03] cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75">\';',
  '        html += \'<span>\' + slotTime + \'</span>\';',
  '        html += \'<span class="balcao-slot-badge text-[9px] uppercase tracking-tighter text-emerald-100 font-bold">\' + badgeLabel + \'</span>\';',
  '        html += \'</button>\';',
  '      } else {',
  '        html += \'<button type="button" data-slot-min="\' + m + \'" data-slot-time="\' + slotTime + \'" onclick="toggleBalcaoTimeSlot(\\\'\' + slotTime + \'\\\')" title="Disponível (\' + slotTime + \' às \' + slotNextTime + \') - Toque para selecionar" class="p-2 rounded-xl text-[11px] font-bold bg-emerald-50/70 hover:bg-emerald-100/90 text-emerald-800 border border-emerald-300 hover:border-emerald-500 cursor-pointer text-center flex flex-col items-center justify-center hover:scale-[1.02] select-none active:scale-95 transition-transform duration-75">\';',
  '        html += \'<span>\' + slotTime + \'</span>\';',
  '        html += \'<span class="balcao-slot-badge text-[9px] uppercase tracking-tighter text-emerald-600 font-semibold">Livre</span>\';',
  '        html += \'</button>\';',
  '      }',
  '    }',
  '',
  '    if (visibleSlotsCount === 0) {',
  '      grid.innerHTML = \'<div class="col-span-full py-6 text-center text-slate-400 font-bold text-xs">Todos os horários desta quadra estão ocupados para esta data. Desmarque a opção "Ocultar Indisponíveis" para ver a grade completa.</div>\';',
  '    } else {',
  '      grid.innerHTML = html;',
  '    }',
  '',
  '    // Checa aviso de próximo jogo após o horário de início selecionado',
  '    if (nextAlertEl && nextAlertText) {',
  '      const nextGame = occupiedRanges.find(r => r.start > currentStartMin);',
  '      if (nextGame) {',
  '        nextAlertEl.style.display = \'flex\';',
  '        nextAlertText.innerHTML = \'<div class="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2"><span>⚠️ A partir das <strong>\' + nextGame.startStr + \'</strong> tem agendamento de <strong>\' + nextGame.name + \'</strong> (\' + nextGame.type + \'). Livre livremente até às <strong>\' + nextGame.startStr + \'</strong>.</span><button type="button" onclick="selectBalcaoUntilNextGame()" class="px-2.5 py-1 bg-sky-700 hover:bg-sky-800 text-white font-extrabold text-[11px] rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition shrink-0"><i data-lucide="zap" class="w-3.5 h-3.5 text-amber-300"></i> Preencher até às \' + nextGame.startStr + \'</button></div>\';',
  '      } else {',
  '        nextAlertEl.style.display = \'none\';',
  '      }',
  '    }',
  '',
  '    // Atualiza o resumo',
  '    updateBalcaoSelectionSummary();',
  '  };',
  '',
  ''
].join('\n');

html = html.substring(0, startIdx) + newRenderCode + html.substring(endIdx);
console.log('  -> renderBalcaoTimeSlots replaced successfully');

fs.writeFileSync(adminHtmlPath, html, 'utf8');
console.log('Successfully written optimized public/admin.html');

// Sync to mirrors
const mirrors = [
  'adm-sec-x9k7-limoeiro-2026-auth.html',
  'adm-sec-x9k7-limoeiro-2026.html',
  'index-sistema1.html',
  'sistema1.html'
];

mirrors.forEach(m => {
  const dest = path.join(__dirname, '..', 'public', m);
  fs.writeFileSync(dest, html, 'utf8');
  console.log('Synced to public/' + m);
});
