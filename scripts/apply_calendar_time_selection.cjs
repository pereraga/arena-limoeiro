const fs = require('fs');
const path = require('path');

const adminHtmlPath = path.join(__dirname, '..', 'public', 'admin.html');
let html = fs.readFileSync(adminHtmlPath, 'utf8');

console.log('1. Adding setBalcaoQuickDuration and updating toggleBalcaoTimeSlot & renderBalcaoTimeSlots...');

const startMarker = '// GESTÃO DE JANELAS DE HORAS (30 EM 30 MIN) PARA RESERVA DIRETA DE BALCÃO';
const endMarker = '  // Helper global para coletar ocupados da quadra/data do modal';

const startIdx = html.indexOf(startMarker);
const endIdx = html.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found! start:', startIdx, 'end:', endIdx);
  process.exit(1);
}

const replacementCode = `// GESTÃO DE JANELAS DE HORAS (30 EM 30 MIN) PARA RESERVA DIRETA DE BALCÃO
  // Otimização Completa: Seleção Direta de INÍCIO e FIM pelo Calendário (0ms delay)
  window.__balcaoSelectionHistory = [];
  window.__balcaoClickState = null; // 'awaiting_end' ou 'complete'

  // Duração rápida por botões de atalho
  window.setBalcaoQuickDuration = function(minutes) {
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    if (!startSelect || !endSelect) return;

    const sMin = parseTimeToMinutes(startSelect.value);
    const targetEndMin = sMin + minutes;
    const occupiedRanges = window.getBalcaoOccupiedRanges ? window.getBalcaoOccupiedRanges() : [];

    const hasConflict = (fromM, toM) => {
      const s = Math.min(fromM, toM);
      const e = Math.max(fromM, toM);
      return occupiedRanges.some(r => Math.max(s, r.start) < Math.min(e, r.end));
    };

    if (hasConflict(sMin, targetEndMin)) {
      if (typeof arenaToast === 'function') {
        arenaToast('Não é possível estender para ' + minutes + 'min devido a jogo agendado no intervalo.');
      }
      return;
    }

    endSelect.value = formatMinutesToTime(targetEndMin);
    window.__balcaoClickState = 'complete';
    autoCalculateDirectBookingPrice();
    renderBalcaoTimeSlots();
  };

  window.renderBalcaoTimeSlots = function(forceRebuild) {
    const grid = document.getElementById('directBookingSlotsGrid');
    if (!grid) return;

    const courtSelect = document.getElementById('directBookingCourt');
    const dateInput = document.getElementById('directBookingDate');
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    const hideToggle = document.getElementById('balcaoHideOccupiedToggle');
    const gamesListEl = document.getElementById('balcaoScheduledGamesList');
    const gamesCountEl = document.getElementById('balcaoScheduledGamesCount');
    const nextAlertEl = document.getElementById('balcaoNextGameAlert');
    const nextAlertText = document.getElementById('balcaoNextGameAlertText');

    const courtId = courtSelect ? courtSelect.value : 'fut7';
    const dateStr = dateInput ? dateInput.value : (window.adminGameState.selectedDate || '2026-11-04');
    const currentStart = startSelect ? startSelect.value : '19:00';
    const currentEnd = endSelect ? endSelect.value : '20:00';
    const shouldHideOccupied = hideToggle ? hideToggle.checked : true;

    const currentStartMin = parseTimeToMinutes(currentStart);
    const currentEndMin = parseTimeToMinutes(currentEnd);

    const filterKey = courtId + '_' + dateStr + '_' + (shouldHideOccupied ? '1' : '0');

    // 1. CAMINHO ULTRA-RÁPIDO: Atualização in-place dos botões existentes (0ms delay)
    if (!forceRebuild && grid.dataset.filterKey === filterKey && grid.children.length > 0) {
      const slotButtons = grid.querySelectorAll('button[data-slot-min]');
      if (slotButtons.length > 0) {
        slotButtons.forEach(btn => {
          if (btn.disabled) return;
          const m = parseInt(btn.dataset.slotMin, 10);
          const isStart = (m === currentStartMin);
          const isEnd = (m === currentEndMin);
          const isBetween = (m > currentStartMin && m < currentEndMin);
          const isSelected = isStart || isEnd || isBetween;
          const badgeSpan = btn.querySelector('.balcao-slot-badge');

          if (isStart) {
            btn.className = 'p-2 rounded-xl text-[11px] font-black bg-emerald-600 text-white border-2 border-emerald-800 shadow-md ring-2 ring-emerald-400 transform scale-[1.04] cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75';
            if (badgeSpan) {
              badgeSpan.className = 'balcao-slot-badge text-[9px] uppercase tracking-wider bg-emerald-800 text-emerald-100 font-black px-1.5 py-0.5 rounded shadow-2xs';
              badgeSpan.textContent = 'Início';
            }
          } else if (isEnd) {
            btn.className = 'p-2 rounded-xl text-[11px] font-black bg-emerald-700 text-white border-2 border-emerald-900 shadow-md ring-2 ring-emerald-400 transform scale-[1.04] cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75';
            if (badgeSpan) {
              badgeSpan.className = 'balcao-slot-badge text-[9px] uppercase tracking-wider bg-emerald-950 text-emerald-100 font-black px-1.5 py-0.5 rounded shadow-2xs';
              badgeSpan.textContent = 'Fim';
            }
          } else if (isBetween) {
            btn.className = 'p-2 rounded-xl text-[11px] font-black bg-emerald-500 text-white border border-emerald-600 shadow-xs cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75';
            if (badgeSpan) {
              badgeSpan.className = 'balcao-slot-badge text-[9px] uppercase tracking-wider text-emerald-100 font-bold';
              badgeSpan.textContent = '✓ Selec.';
            }
          } else {
            btn.className = 'p-2 rounded-xl text-[11px] font-bold bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 hover:border-emerald-500 cursor-pointer text-center flex flex-col items-center justify-center hover:scale-[1.02] select-none active:scale-95 transition-transform duration-75';
            if (badgeSpan) {
              badgeSpan.className = 'balcao-slot-badge text-[9px] uppercase tracking-wider text-emerald-600 font-semibold';
              badgeSpan.textContent = 'Livre';
            }
          }
        });

        // Atualiza aviso de próximo jogo se necessário
        if (nextAlertEl && nextAlertText) {
          const occupiedRanges = window.getBalcaoOccupiedRanges(courtId, dateStr);
          const nextGame = occupiedRanges.find(r => r.start > currentStartMin);
          if (nextGame) {
            nextAlertEl.style.display = 'flex';
            nextAlertText.innerHTML = '<div class="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2"><span>⚠️ A partir das <strong>' + nextGame.startStr + '</strong> tem agendamento de <strong>' + nextGame.name + '</strong> (' + nextGame.type + '). Livre até às <strong>' + nextGame.startStr + '</strong>.</span><button type="button" onclick="selectBalcaoUntilNextGame()" class="px-2.5 py-1 bg-sky-700 hover:bg-sky-800 text-white font-extrabold text-[11px] rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition shrink-0"><i data-lucide="zap" class="w-3.5 h-3.5 text-amber-300"></i> Preencher até às ' + nextGame.startStr + '</button></div>';
          } else {
            nextAlertEl.style.display = 'none';
          }
        }

        updateBalcaoSelectionSummary();
        return;
      }
    }

    // 2. CONSTRUÇÃO COMPLETA DA GRADE
    grid.dataset.filterKey = filterKey;

    const todayStr = window.adminGameState.selectedDate || '2026-11-04';
    const isToday = (dateStr === todayStr);

    const now = new Date();
    const currentRealMinutes = (now.getHours() * 60) + now.getMinutes();

    // Coletar intervalos ocupados no dia para esta quadra
    const occupiedRanges = window.getBalcaoOccupiedRanges(courtId, dateStr);

    // Atualiza o Card Informativo de Jogos Agendados
    if (gamesListEl) {
      if (occupiedRanges.length === 0) {
        gamesListEl.innerHTML = '<span class="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">✨ Nenhum jogo agendado nesta quadra neste dia. Todos os horários estão livres!</span>';
        if (gamesCountEl) gamesCountEl.textContent = '0 agendados';
      } else {
        if (gamesCountEl) gamesCountEl.textContent = occupiedRanges.length + (occupiedRanges.length === 1 ? ' agendado' : ' agendados');
        let listHtml = '';
        occupiedRanges.forEach(g => {
          listHtml += '<span class="inline-flex items-center gap-1 bg-amber-100/90 text-amber-950 font-extrabold px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs">';
          listHtml += '🕒 ' + g.startStr + ' às ' + g.endStr + ' — <strong class="text-amber-900">' + g.name + '</strong> (' + g.type + ')';
          listHtml += '</span>';
        });
        gamesListEl.innerHTML = listHtml;
      }
    }

    let html = '';
    let visibleSlotsCount = 0;

    for (let m = 6 * 60; m <= 23 * 60; m += 30) {
      const slotTime = formatMinutesToTime(m);
      const slotNextTime = formatMinutesToTime(m + 30);
      const slotEndMin = m + 30;

      // Verifica se o slot está em conflito com algum jogo já agendado
      const conflict = occupiedRanges.find(r => Math.max(m, r.start) < Math.min(slotEndMin, r.end));
      const isOccupied = !!conflict;
      
      // Checa se o horário já passou hoje
      const isPast = (isToday && slotEndMin <= currentRealMinutes);
      const isUnavailable = isOccupied || isPast;

      // Se o filtro de ocultar indisponíveis estiver ativado, esconde
      if (shouldHideOccupied && isUnavailable) {
        continue;
      }

      visibleSlotsCount++;
      const isStart = (m === currentStartMin);
      const isEnd = (m === currentEndMin);
      const isBetween = (m > currentStartMin && m < currentEndMin);
      const isSelected = isStart || isEnd || isBetween;

      if (isOccupied) {
        html += '<button type="button" disabled data-slot-min="' + m + '" title="Ocupado: ' + conflict.name + ' (' + conflict.startStr + ' às ' + conflict.endStr + ')" class="p-2 rounded-xl text-[11px] font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60 line-through text-center flex flex-col items-center justify-center select-none">';
        html += '<span class="font-bold">' + slotTime + '</span>';
        html += '<span class="balcao-slot-badge text-[9px] uppercase tracking-tighter truncate max-w-[55px]">' + conflict.name + '</span>';
        html += '</button>';
      } else if (isPast) {
        html += '<button type="button" disabled data-slot-min="' + m + '" title="Horário já passado" class="p-2 rounded-xl text-[11px] font-semibold bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed opacity-50 text-center flex flex-col items-center justify-center select-none">';
        html += '<span class="font-bold">' + slotTime + '</span>';
        html += '<span class="balcao-slot-badge text-[9px] uppercase tracking-tighter">Passado</span>';
        html += '</button>';
      } else if (isStart) {
        html += '<button type="button" data-slot-min="' + m + '" data-slot-time="' + slotTime + '" onclick="toggleBalcaoTimeSlot(\\\'' + slotTime + '\\\')" title="Início do jogo (' + slotTime + ')" class="p-2 rounded-xl text-[11px] font-black bg-emerald-600 text-white border-2 border-emerald-800 shadow-md ring-2 ring-emerald-400 transform scale-[1.04] cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75">';
        html += '<span>' + slotTime + '</span>';
        html += '<span class="balcao-slot-badge text-[9px] uppercase tracking-wider bg-emerald-800 text-emerald-100 font-black px-1.5 py-0.5 rounded shadow-2xs">Início</span>';
        html += '</button>';
      } else if (isEnd) {
        html += '<button type="button" data-slot-min="' + m + '" data-slot-time="' + slotTime + '" onclick="toggleBalcaoTimeSlot(\\\'' + slotTime + '\\\')" title="Término do jogo (' + slotTime + ')" class="p-2 rounded-xl text-[11px] font-black bg-emerald-700 text-white border-2 border-emerald-900 shadow-md ring-2 ring-emerald-400 transform scale-[1.04] cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75">';
        html += '<span>' + slotTime + '</span>';
        html += '<span class="balcao-slot-badge text-[9px] uppercase tracking-wider bg-emerald-950 text-emerald-100 font-black px-1.5 py-0.5 rounded shadow-2xs">Fim</span>';
        html += '</button>';
      } else if (isBetween) {
        html += '<button type="button" data-slot-min="' + m + '" data-slot-time="' + slotTime + '" onclick="toggleBalcaoTimeSlot(\\\'' + slotTime + '\\\')" title="Horário em jogo (' + slotTime + ')" class="p-2 rounded-xl text-[11px] font-black bg-emerald-500 text-white border border-emerald-600 shadow-xs cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75">';
        html += '<span>' + slotTime + '</span>';
        html += '<span class="balcao-slot-badge text-[9px] uppercase tracking-wider text-emerald-100 font-bold">✓ Selec.</span>';
        html += '</button>';
      } else {
        html += '<button type="button" data-slot-min="' + m + '" data-slot-time="' + slotTime + '" onclick="toggleBalcaoTimeSlot(\\\'' + slotTime + '\\\')" title="Disponível (' + slotTime + ') - Toque para selecionar" class="p-2 rounded-xl text-[11px] font-bold bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 hover:border-emerald-500 cursor-pointer text-center flex flex-col items-center justify-center hover:scale-[1.02] select-none active:scale-95 transition-transform duration-75">';
        html += '<span>' + slotTime + '</span>';
        html += '<span class="balcao-slot-badge text-[9px] uppercase tracking-wider text-emerald-600 font-semibold">Livre</span>';
        html += '</button>';
      }
    }

    if (visibleSlotsCount === 0) {
      grid.innerHTML = '<div class="col-span-full py-6 text-center text-slate-400 font-bold text-xs">Todos os horários desta quadra estão ocupados para esta data. Desmarque a opção "Ocultar Indisponíveis" para ver a grade completa.</div>';
    } else {
      grid.innerHTML = html;
    }

    // Checa aviso de próximo jogo após o horário de início selecionado
    if (nextAlertEl && nextAlertText) {
      const nextGame = occupiedRanges.find(r => r.start > currentStartMin);
      if (nextGame) {
        nextAlertEl.style.display = 'flex';
        nextAlertText.innerHTML = '<div class="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2"><span>⚠️ A partir das <strong>' + nextGame.startStr + '</strong> tem agendamento de <strong>' + nextGame.name + '</strong> (' + nextGame.type + '). Livre até às <strong>' + nextGame.startStr + '</strong>.</span><button type="button" onclick="selectBalcaoUntilNextGame()" class="px-2.5 py-1 bg-sky-700 hover:bg-sky-800 text-white font-extrabold text-[11px] rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition shrink-0"><i data-lucide="zap" class="w-3.5 h-3.5 text-amber-300"></i> Preencher até às ' + nextGame.startStr + '</button></div>';
      } else {
        nextAlertEl.style.display = 'none';
      }
    }

    updateBalcaoSelectionSummary();
  };

  // Alterna e define intervalos de horários com precisão pelo calendário
  window.toggleBalcaoTimeSlot = function(slotTime) {
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    if (!startSelect || !endSelect) return;

    const clickedMin = parseTimeToMinutes(slotTime);
    let curStartMin = parseTimeToMinutes(startSelect.value);
    let curEndMin = parseTimeToMinutes(endSelect.value);
    const occupiedRanges = window.getBalcaoOccupiedRanges ? window.getBalcaoOccupiedRanges() : [];

    // Salva histórico para botão Voltar
    window.__balcaoSelectionHistory = window.__balcaoSelectionHistory || [];
    window.__balcaoSelectionHistory.push({ start: startSelect.value, end: endSelect.value, state: window.__balcaoClickState });
    if (window.__balcaoSelectionHistory.length > 20) window.__balcaoSelectionHistory.shift();

    const hasConflict = (fromM, toM) => {
      const s = Math.min(fromM, toM);
      const e = Math.max(fromM, toM);
      return occupiedRanges.some(r => Math.max(s, r.start) < Math.min(e, r.end));
    };

    // Caso 1: Usuário acabou de clicar em um Início e agora clica em um horário posterior para ser o FIM
    if (window.__balcaoClickState === 'awaiting_end') {
      if (clickedMin > curStartMin && !hasConflict(curStartMin, clickedMin)) {
        // Define o FIM exatamente no botão clicado!
        // Ex: Início 12:00 -> clica 12:30 -> Fim 12:30 (meia hora)
        // Ex: Início 12:00 -> clica 13:00 -> Fim 13:00 (1 hora)
        // Ex: Início 12:00 -> clica 14:00 -> Fim 14:00 (2 horas)
        endSelect.value = slotTime;
        window.__balcaoClickState = 'complete';
      } else if (clickedMin === curStartMin) {
        // Clicou no mesmo slot de início -> alterna entre 30 min e 1 hora
        const curDiff = curEndMin - curStartMin;
        if (curDiff === 30 && !hasConflict(curStartMin, curStartMin + 60)) {
          endSelect.value = formatMinutesToTime(curStartMin + 60);
        } else {
          endSelect.value = formatMinutesToTime(curStartMin + 30);
        }
        window.__balcaoClickState = 'complete';
      } else {
        // Clicou em horário anterior ou com conflito -> inicia novo início no slot clicado
        startSelect.value = slotTime;
        const defEnd = !hasConflict(clickedMin, clickedMin + 60) ? (clickedMin + 60) : (clickedMin + 30);
        endSelect.value = formatMinutesToTime(defEnd);
        window.__balcaoClickState = 'awaiting_end';
      }
    } 
    // Caso 2: Já existia uma seleção completa (ou inicial)
    else {
      // Se clicou em um horário posterior ao início atual e sem conflito, ajusta o FIM para o horário clicado
      if (clickedMin > curStartMin && !hasConflict(curStartMin, clickedMin)) {
        endSelect.value = slotTime;
        window.__balcaoClickState = 'complete';
      } 
      // Se clicou no mesmo botão de início, alterna entre 30min e 1h
      else if (clickedMin === curStartMin) {
        const curDiff = curEndMin - curStartMin;
        if (curDiff === 30 && !hasConflict(curStartMin, curStartMin + 60)) {
          endSelect.value = formatMinutesToTime(curStartMin + 60);
        } else {
          endSelect.value = formatMinutesToTime(curStartMin + 30);
        }
        window.__balcaoClickState = 'complete';
      } 
      // Caso contrário, inicia nova seleção naquele horário
      else {
        startSelect.value = slotTime;
        const defEnd = !hasConflict(clickedMin, clickedMin + 60) ? (clickedMin + 60) : (clickedMin + 30);
        endSelect.value = formatMinutesToTime(defEnd);
        window.__balcaoClickState = 'awaiting_end';
      }
    }

    autoCalculateDirectBookingPrice();
    renderBalcaoTimeSlots();
  };

  window.undoLastBalcaoTimeSlot = function() {
    if (!window.__balcaoSelectionHistory || window.__balcaoSelectionHistory.length === 0) {
      if (typeof window.showNotification === 'function') {
        window.showNotification('Nenhuma seleção anterior para voltar.');
      }
      return;
    }

    const prev = window.__balcaoSelectionHistory.pop();
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');

    if (startSelect && endSelect && prev) {
      startSelect.value = prev.start;
      endSelect.value = prev.end;
      window.__balcaoClickState = prev.state || 'complete';
      autoCalculateDirectBookingPrice();
      renderBalcaoTimeSlots();
      if (typeof window.showNotification === 'function') {
        window.showNotification('Seleção de horário anterior restaurada!');
      }
    }
  };

  window.resetDirectBookingTimeSlots = function() {
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    if (typeof findFirstAvailableSlot === 'function' && startSelect && endSelect) {
      const firstFree = findFirstAvailableSlot();
      startSelect.value = firstFree.start;
      endSelect.value = firstFree.end;
      window.__balcaoClickState = null;
      autoCalculateDirectBookingPrice();
      renderBalcaoTimeSlots();
      if (typeof window.showNotification === 'function') {
        window.showNotification('Horários redefinidos para o primeiro livre!');
      }
    }
  };

  window.selectBalcaoUntilNextGame = function() {
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    if (!startSelect || !endSelect) return;

    const startMin = parseTimeToMinutes(startSelect.value);
    const occupiedRanges = window.getBalcaoOccupiedRanges ? window.getBalcaoOccupiedRanges() : [];

    const nextGame = occupiedRanges.find(r => r.start > startMin);
    let targetEndMin = 0;
    let reason = '';

    if (nextGame) {
      targetEndMin = nextGame.start;
      reason = 'até o jogo de ' + nextGame.name;
    } else {
      targetEndMin = 23 * 60 + 30; // 23:30
      reason = 'até o encerramento do dia';
    }

    if (targetEndMin <= startMin) {
      if (typeof arenaToast === 'function') {
        arenaToast('Não há espaço livre adicional após ' + startSelect.value + '.');
      }
      return;
    }

    endSelect.value = formatMinutesToTime(targetEndMin);
    window.__balcaoClickState = 'complete';
    autoCalculateDirectBookingPrice();
    renderBalcaoTimeSlots();

    if (typeof arenaToast === 'function') {
      arenaToast('Horário preenchido de ' + startSelect.value + ' às ' + formatMinutesToTime(targetEndMin) + ' (' + reason + ')!');
    }
  };\n\n`;

html = html.substring(0, startIdx) + replacementCode + html.substring(endIdx);
console.log('  -> Core logic replaced successfully');

console.log('2. Updating updateBalcaoSelectionSummary to update helper text and duration...');
const oldSummaryDef = 'window.updateBalcaoSelectionSummary = function() {';
const summaryIdx = html.indexOf(oldSummaryDef);
if (summaryIdx !== -1) {
  const summaryEndIdx = html.indexOf('window.openDirectBookingModal = function()', summaryIdx);
  if (summaryEndIdx !== -1) {
    const newSummaryCode = `window.updateBalcaoSelectionSummary = function() {
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    const timeEl = document.getElementById('summarySelectedTime');
    const durEl = document.getElementById('summaryDuration');
    const helperBannerText = document.getElementById('balcaoStepHelperText');
    const helperBadge = document.getElementById('balcaoHelperDurationBadge');

    if (!startSelect || !endSelect) return;

    const sStr = startSelect.value || '19:00';
    const eStr = endSelect.value || '20:00';
    const sMin = parseTimeToMinutes(sStr);
    const eMin = parseTimeToMinutes(eStr);
    let diff = eMin - sMin;
    if (diff < 0) diff += 1440;

    const h = Math.floor(diff / 60);
    const m = diff % 60;
    let durTxt = '';
    if (h > 0) durTxt += h + 'h';
    if (m > 0) durTxt += (h > 0 ? ' ' : '') + m + 'min';
    if (diff === 0) durTxt = '0min';

    const blocksCount = Math.round(diff / 30);
    const detailTxt = durTxt + ' • ' + blocksCount + (blocksCount === 1 ? ' janela (30min)' : ' janelas (30min)');

    if (timeEl) timeEl.textContent = sStr + ' às ' + eStr;
    if (durEl) durEl.textContent = durTxt;

    if (helperBannerText) {
      if (window.__balcaoClickState === 'awaiting_end') {
        helperBannerText.innerHTML = '🟢 <strong>INÍCIO: ' + sStr + '</strong> definido. Clique agora no horário de <strong>FIM</strong> no calendário (ex: 12:30 para meia hora ou 13:00 para 1h):';
      } else {
        helperBannerText.innerHTML = '✅ Horário Selecionado: <strong>' + sStr + ' às ' + eStr + '</strong> (' + durTxt + '). Toque em outro horário se quiser mudar.';
      }
    }
    if (helperBadge) {
      helperBadge.textContent = durTxt + (diff === 30 ? ' (30 min)' : (diff === 60 ? ' (1 hora)' : ''));
    }
  };\n\n  `;
    html = html.substring(0, summaryIdx) + newSummaryCode + html.substring(summaryEndIdx);
    console.log('  -> updateBalcaoSelectionSummary replaced successfully');
  }
}

console.log('3. Updating modal HTML controls...');

const toggleIdx = html.indexOf('balcaoHideOccupiedToggle');
const targetBlockStart = html.lastIndexOf('<div class="flex items-center gap-1.5 flex-wrap">', toggleIdx);
const targetBlockEnd = html.indexOf('<!-- Grade de Janelas de 30 minutos', toggleIdx);

if (targetBlockStart !== -1 && targetBlockEnd !== -1) {
  const newHeaderHtml = `<div class="flex items-center gap-1.5 flex-wrap">
            <label class="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs hover:bg-slate-50">
              <input type="checkbox" id="balcaoHideOccupiedToggle" onchange="renderBalcaoTimeSlots()" checked class="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer">
              <span>Ocultar Indisponíveis</span>
            </label>
            <button type="button" onclick="undoLastBalcaoTimeSlot()" title="Desfazer última alteração de horário" class="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition">
              <i data-lucide="undo-2" class="w-3 h-3 text-slate-500"></i>
              <span>Voltar Seleção</span>
            </button>
            <button type="button" onclick="resetDirectBookingTimeSlots()" title="Limpar horários selecionados" class="px-2 py-1 text-[11px] font-bold bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition">
              <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
              <span>Limpar</span>
            </button>
          </div>
        </div>

        <!-- Atalhos de Duração Rápida -->
        <div class="flex items-center justify-between flex-wrap gap-1.5 p-2 bg-emerald-50/70 border border-emerald-200/90 rounded-xl">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[11px] font-black text-emerald-950 uppercase tracking-tight flex items-center gap-1">
              <span>⏱️</span> Duração Rápida:
            </span>
            <button type="button" onclick="setBalcaoQuickDuration(30)" class="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 text-emerald-900 font-black text-[11px] border border-emerald-300 shadow-2xs transition cursor-pointer">⚡ 30 min (Meia hora)</button>
            <button type="button" onclick="setBalcaoQuickDuration(60)" class="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 text-emerald-900 font-black text-[11px] border border-emerald-300 shadow-2xs transition cursor-pointer">⚡ 1 hora</button>
            <button type="button" onclick="setBalcaoQuickDuration(90)" class="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 text-emerald-900 font-black text-[11px] border border-emerald-300 shadow-2xs transition cursor-pointer">⚡ 1h30</button>
            <button type="button" onclick="setBalcaoQuickDuration(120)" class="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 text-emerald-900 font-black text-[11px] border border-emerald-300 shadow-2xs transition cursor-pointer">⚡ 2 horas</button>
            <button type="button" onclick="selectBalcaoUntilNextGame()" class="px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-900 font-black text-[11px] border border-sky-300 shadow-2xs transition cursor-pointer">⚡ Até Próximo Jogo</button>
          </div>
        </div>

        <!-- Banner de Orientação e Status Interativo -->
        <div id="balcaoCalendarStepHelper" class="p-2.5 rounded-xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 text-white shadow-xs flex items-center justify-between gap-2 text-xs font-bold">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-black text-xs shrink-0">📅</span>
            <span id="balcaoStepHelperText">Clique no horário de <strong>INÍCIO</strong> e depois no horário de <strong>FIM</strong> no calendário.</span>
          </div>
          <div class="text-right shrink-0">
            <span id="balcaoHelperDurationBadge" class="px-2.5 py-1 rounded-md bg-white text-emerald-900 font-black text-[11px] shadow-2xs">1 hora</span>
          </div>
        </div>\n\n        `;

  html = html.substring(0, targetBlockStart) + newHeaderHtml + html.substring(targetBlockEnd);
  console.log('  -> Modal header & quick duration pills inserted successfully');
} else {
  console.error('Target block indices not found!', targetBlockStart, targetBlockEnd);
  process.exit(1);
}

fs.writeFileSync(adminHtmlPath, html, 'utf8');
console.log('Successfully written public/admin.html');

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
