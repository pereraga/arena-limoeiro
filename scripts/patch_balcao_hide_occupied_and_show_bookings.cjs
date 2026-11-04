const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

// 1. Replace the entire Time Selection section inside directBookingModal
const oldSectionStart = '<!-- JANELAS SEPARADAS DE HORÁRIOS (SLOTS DE 30 EM 30 MINUTOS) -->';
const oldSectionEnd = '<!-- SELEÇÃO NUMÉRICA & VALOR TOTAL -->';

const newSectionMarkup = `<!-- JANELAS SEPARADAS DE HORÁRIOS (SLOTS DE 30 EM 30 MINUTOS) -->
      <div class="space-y-3 p-3.5 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 border border-emerald-200/80 rounded-2xl shadow-xs">
        
        <!-- CARD INFORMATIVO: JOGOS JÁ AGENDADOS NESTA QUADRA NO DIA -->
        <div id="balcaoScheduledGamesCard" class="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="font-extrabold text-amber-900 uppercase flex items-center gap-1.5 text-[11px]">
              <i data-lucide="info" class="w-3.5 h-3.5 text-amber-600"></i>
              <span>Partidas / Clientes Já Agendados Nesta Quadra:</span>
            </span>
            <span id="balcaoScheduledGamesCount" class="text-[10px] font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">0 agendados</span>
          </div>
          <div id="balcaoScheduledGamesList" class="flex flex-wrap gap-1.5 text-xs">
            <!-- Injetado dinamicamente: ex: [ 15:30 às 16:30 — Monica ] [ 18:00 às 20:00 — Aline ] -->
          </div>
        </div>

        <!-- Cabeçalho da Grade de Slots + Filtro de Ocultar Ocupados -->
        <div class="flex items-center justify-between flex-wrap gap-2 pt-1">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
              <i data-lucide="calendar-check" class="w-3.5 h-3.5"></i>
            </span>
            <div>
              <span class="text-xs font-black text-slate-800 uppercase tracking-tight block">Janelas de Horas (30 em 30 min):</span>
              <span class="text-[10px] text-slate-500 font-medium">Selecione o horário desejado para a nova reserva de balcão.</span>
            </div>
          </div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <label class="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs hover:bg-slate-50">
              <input type="checkbox" id="balcaoHideOccupiedToggle" onchange="renderBalcaoTimeSlots()" checked class="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer">
              <span>Ocultar Indisponíveis</span>
            </label>
            <button type="button" onclick="undoLastBalcaoTimeSlot()" title="Voltar última seleção de horário" class="px-2 py-1 text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition">
              <i data-lucide="undo-2" class="w-3 h-3 text-slate-500"></i>
              <span>Voltar Seleção</span>
            </button>
            <button type="button" onclick="resetDirectBookingTimeSlots()" title="Limpar horários selecionados" class="px-2 py-1 text-[11px] font-bold bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition">
              <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
              <span>Limpar</span>
            </button>
          </div>
        </div>

        <!-- Grade de Janelas de 30 minutos geradas dinamicamente -->
        <div id="directBookingSlotsGrid" class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
          <!-- Slots de 30min injetados aqui -->
        </div>

        <!-- Alerta de Limite de Horário / Jogo Concorrente -->
        <div id="balcaoNextGameAlert" style="display:none;" class="p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-xs font-semibold text-sky-900 flex items-center gap-2">
          <i data-lucide="alert-circle" class="w-4 h-4 text-sky-600 shrink-0"></i>
          <span id="balcaoNextGameAlertText">Atenção: Próximo jogo agendado detectado.</span>
        </div>

        <!-- Legenda e Resumo da Seleção -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px]">
          <div class="flex items-center gap-2.5 flex-wrap">
            <span class="inline-flex items-center gap-1 text-slate-600 font-semibold">
              <span class="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-400"></span> Disponível
            </span>
            <span class="inline-flex items-center gap-1 text-slate-700 font-bold">
              <span class="w-2.5 h-2.5 rounded-sm bg-emerald-600 border border-emerald-700"></span> Selecionado
            </span>
            <span id="balcaoOccupiedLegend" class="inline-flex items-center gap-1 text-slate-400 font-medium">
              <span class="w-2.5 h-2.5 rounded-sm bg-slate-200 border border-slate-300"></span> Ocupado
            </span>
          </div>

          <div id="balcaoSlotSelectionSummary" class="text-xs font-bold text-emerald-900 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center gap-1.5">
            <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>Horário: <strong id="summarySelectedTime">19:00 às 20:00</strong> (<span id="summaryDuration">1h</span>)</span>
          </div>
        </div>
      </div>\n\n      `;

const startIdx = content.indexOf(oldSectionStart);
const endIdx = content.indexOf(oldSectionEnd);

if (startIdx !== -1 && endIdx !== -1) {
  content = content.slice(0, startIdx) + newSectionMarkup + content.slice(endIdx);
  console.log('Modal Time Selection Markup updated with Scheduled Games Card & Filter.');
} else {
  console.error('Could not locate old time section in admin.html');
}

// 2. Update JavaScript implementation for renderBalcaoTimeSlots, toggleBalcaoTimeSlot, and openDirectBookingModal
const oldJsStart = '  // GESTÃO DE JANELAS DE HORAS (30 EM 30 MIN) PARA RESERVA DIRETA DE BALCÃO';
const oldJsEnd = '  window.openDirectBookingModal = function() {';

const newJs = `  // GESTÃO DE JANELAS DE HORAS (30 EM 30 MIN) PARA RESERVA DIRETA DE BALCÃO
  window.__balcaoSelectionHistory = [];

  window.renderBalcaoTimeSlots = function() {
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

    // Mapeamento da quadra selecionada
    let dbCourtId = courtId;
    if (courtId === 'fut5') dbCourtId = 'court-esportes-de-quadra-1788962671043';
    if (courtId === 'fut6') dbCourtId = 'court-society-2';
    if (courtId === 'fut7') dbCourtId = 'court-futsal-1788963178368';
    if (courtId === 'society') dbCourtId = 'court-society-1';
    if (courtId === 'areia') dbCourtId = 'court-beach-1';
    if (courtId === 'futmesa') dbCourtId = 'court-futmesa-1';

    // Obter dia da semana para mensalistas
    const dateObj = new Date(dateStr + 'T12:00:00');
    const daysMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const dayOfWeek = daysMap[dateObj.getDay()];

    // Checar se a data selecionada é hoje
    const todayStr = window.adminGameState.selectedDate || '2026-11-04';
    const isToday = (dateStr === todayStr);

    // Horário atual aproximado em minutos
    const now = new Date();
    const currentRealMinutes = (now.getHours() * 60) + now.getMinutes();

    // Coletar intervalos ocupados no dia para esta quadra
    const occupiedRanges = [];

    // 1. Partidas já registradas
    (window.adminGameState.bookings || []).forEach(b => {
      const bDate = b.date;
      const bCourt = b.court_id || b.courtId;
      const st = (b.status || '').toLowerCase();
      if (bDate === dateStr && st !== 'cancelled' && (bCourt === dbCourtId || bCourt === courtId)) {
        const sm = parseTimeToMinutes(b.start_time || (b.time ? b.time.split(' ')[0] : ''));
        const em = parseTimeToMinutes(b.end_time || (b.time && b.time.includes('às') ? b.time.split('às')[1].trim() : ''));
        if (em > sm) {
          occupiedRanges.push({
            start: sm,
            end: em,
            startStr: formatMinutesToTime(sm),
            endStr: formatMinutesToTime(em),
            name: b.customer_name || 'Cliente',
            type: b.booking_type === 'mensalista' ? 'Mensalista' : 'Reserva',
            status: b.status
          });
        }
      }
    });

    // 2. Mensalistas fixos deste dia da semana
    (window.adminGameState.monthlyMembers || []).forEach(m => {
      const mDay = (m.day_of_week || m.dayOfWeek || '').toLowerCase();
      const mCourt = m.court_id || m.courtId;
      const mStatus = (m.status || '').toLowerCase();
      if (mDay === dayOfWeek && mStatus !== 'inactive' && (mCourt === dbCourtId || mCourt === courtId)) {
        const sm = parseTimeToMinutes(m.start_time || m.time || '');
        const em = parseTimeToMinutes(m.end_time || '');
        const effectiveEnd = em > sm ? em : (sm + 60);
        // Evita duplicar se já foi adicionado como booking
        const exists = occupiedRanges.some(r => Math.abs(r.start - sm) < 15);
        if (!exists) {
          occupiedRanges.push({
            start: sm,
            end: effectiveEnd,
            startStr: formatMinutesToTime(sm),
            endStr: formatMinutesToTime(effectiveEnd),
            name: m.team_name || m.responsible_name || 'Mensalista Fixo',
            type: 'Mensalista Fixo',
            status: 'confirmed'
          });
        }
      }
    });

    // Ordenar ocupados por ordem cronológica
    occupiedRanges.sort((a, b) => a.start - b.start);

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

    // Se estiver no dia atual, slots anteriores ao horário de abertura ou no passado
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
      const isPast = (isToday && m < (11 * 60)); // horários passados hoje
      const isUnavailable = isOccupied || isPast;

      // Se o filtro de ocultar indisponíveis estiver ativado, esconde
      if (shouldHideOccupied && isUnavailable) {
        continue;
      }

      visibleSlotsCount++;
      const isSelected = (!isUnavailable && m >= currentStartMin && slotEndMin <= currentEndMin);

      if (isOccupied) {
        html += '<button type="button" disabled title="Ocupado: ' + conflict.name + ' (' + conflict.startStr + ' às ' + conflict.endStr + ')" class="p-2 rounded-xl text-[11px] font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60 line-through text-center transition flex flex-col items-center justify-center">';
        html += '<span class="font-bold">' + slotTime + '</span>';
        html += '<span class="text-[9px] uppercase tracking-tighter truncate max-w-[55px]">' + conflict.name + '</span>';
        html += '</button>';
      } else if (isPast) {
        html += '<button type="button" disabled title="Horário já passado" class="p-2 rounded-xl text-[11px] font-semibold bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed opacity-50 text-center transition flex flex-col items-center justify-center">';
        html += '<span class="font-bold">' + slotTime + '</span>';
        html += '<span class="text-[9px] uppercase tracking-tighter">Passado</span>';
        html += '</button>';
      } else if (isSelected) {
        html += '<button type="button" onclick="toggleBalcaoTimeSlot(\\'' + slotTime + '\\')" title="Selecionado (' + slotTime + ' às ' + slotNextTime + ') - Toque para alterar ou voltar" class="p-2 rounded-xl text-[11px] font-black bg-emerald-600 text-white border-2 border-emerald-700 shadow-md transform scale-[1.03] cursor-pointer text-center transition flex flex-col items-center justify-center">';
        html += '<span>' + slotTime + '</span>';
        html += '<span class="text-[9px] uppercase tracking-tighter text-emerald-100">✓ Selec.</span>';
        html += '</button>';
      } else {
        html += '<button type="button" onclick="toggleBalcaoTimeSlot(\\'' + slotTime + '\\')" title="Disponível (' + slotTime + ' às ' + slotNextTime + ') - Toque para selecionar" class="p-2 rounded-xl text-[11px] font-bold bg-emerald-50/70 hover:bg-emerald-100/90 text-emerald-800 border border-emerald-300 hover:border-emerald-500 cursor-pointer text-center transition flex flex-col items-center justify-center hover:scale-[1.02]">';
        html += '<span>' + slotTime + '</span>';
        html += '<span class="text-[9px] uppercase tracking-tighter text-emerald-600 font-semibold">Livre</span>';
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
      const nextGame = occupiedRanges.find(r => r.start >= currentStartMin);
      if (nextGame) {
        nextAlertEl.style.display = 'flex';
        nextAlertText.innerHTML = '⚠️ Atenção: A partir das <strong>' + nextGame.startStr + '</strong> tem jogo agendado de <strong>' + nextGame.name + '</strong> (até às ' + nextGame.endStr + '). Disponível livremente até às ' + nextGame.startStr + '.';
      } else {
        nextAlertEl.style.display = 'none';
      }
    }

    // Atualiza o resumo
    updateBalcaoSelectionSummary();
    if (window.lucide) lucide.createIcons();
  };

  window.toggleBalcaoTimeSlot = function(slotTime) {
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    if (!startSelect || !endSelect) return;

    const clickedMin = parseTimeToMinutes(slotTime);
    const curStartMin = parseTimeToMinutes(startSelect.value);
    const curEndMin = parseTimeToMinutes(endSelect.value);

    // Salva estado para botão Voltar
    window.__balcaoSelectionHistory = window.__balcaoSelectionHistory || [];
    window.__balcaoSelectionHistory.push({ start: startSelect.value, end: endSelect.value });
    if (window.__balcaoSelectionHistory.length > 20) window.__balcaoSelectionHistory.shift();

    // Se clicar em um horário já selecionado, recua ou desfaz
    if (clickedMin === curStartMin && curEndMin - curStartMin > 30) {
      startSelect.value = formatMinutesToTime(curStartMin + 30);
    } else if (clickedMin === curEndMin - 30 && curEndMin - curStartMin > 30) {
      endSelect.value = formatMinutesToTime(curEndMin - 30);
    } else {
      // Define nova seleção de 1 hora a partir do slot clicado
      startSelect.value = slotTime;
      endSelect.value = formatMinutesToTime(clickedMin + 60);
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
    if (startSelect && endSelect) {
      window.__balcaoSelectionHistory = window.__balcaoSelectionHistory || [];
      window.__balcaoSelectionHistory.push({ start: startSelect.value, end: endSelect.value });
      
      // Encontra o próximo horário livre e define
      const firstFree = findFirstAvailableSlot();
      startSelect.value = firstFree.start;
      endSelect.value = firstFree.end;
      autoCalculateDirectBookingPrice();
      renderBalcaoTimeSlots();
      if (typeof window.showNotification === 'function') {
        window.showNotification('Horários redefinidos para janela livre.');
      }
    }
  };

  function findFirstAvailableSlot() {
    const courtSelect = document.getElementById('directBookingCourt');
    const dateInput = document.getElementById('directBookingDate');
    const courtId = courtSelect ? courtSelect.value : 'fut7';
    const dateStr = dateInput ? dateInput.value : (window.adminGameState.selectedDate || '2026-11-04');

    let dbCourtId = courtId;
    if (courtId === 'fut5') dbCourtId = 'court-esportes-de-quadra-1788962671043';
    if (courtId === 'fut6') dbCourtId = 'court-society-2';
    if (courtId === 'fut7') dbCourtId = 'court-futsal-1788963178368';
    if (courtId === 'society') dbCourtId = 'court-society-1';
    if (courtId === 'areia') dbCourtId = 'court-beach-1';
    if (courtId === 'futmesa') dbCourtId = 'court-futmesa-1';

    const occupiedRanges = [];
    (window.adminGameState.bookings || []).forEach(b => {
      const bDate = b.date;
      const bCourt = b.court_id || b.courtId;
      const st = (b.status || '').toLowerCase();
      if (bDate === dateStr && st !== 'cancelled' && (bCourt === dbCourtId || bCourt === courtId)) {
        const sm = parseTimeToMinutes(b.start_time || (b.time ? b.time.split(' ')[0] : ''));
        const em = parseTimeToMinutes(b.end_time || (b.time && b.time.includes('às') ? b.time.split('às')[1].trim() : ''));
        if (em > sm) occupiedRanges.push({ start: sm, end: em });
      }
    });

    // Procura primeiro bloco de 1 hora livre a partir das 11:30
    for (let m = 11 * 60 + 30; m <= 22 * 60; m += 30) {
      const end = m + 60;
      const conflict = occupiedRanges.find(r => Math.max(m, r.start) < Math.min(end, r.end));
      if (!conflict) {
        return { start: formatMinutesToTime(m), end: formatMinutesToTime(end) };
      }
    }
    return { start: '19:00', end: '20:00' };
  }

  window.onDirectBookingDropdownChange = function() {
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    if (!startSelect || !endSelect) return;

    let sMin = parseTimeToMinutes(startSelect.value);
    let eMin = parseTimeToMinutes(endSelect.value);

    if (eMin <= sMin) {
      eMin = sMin + 30;
      endSelect.value = formatMinutesToTime(eMin);
    }

    autoCalculateDirectBookingPrice();
    renderBalcaoTimeSlots();
  };

  window.updateBalcaoSelectionSummary = function() {
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    const timeEl = document.getElementById('summarySelectedTime');
    const durEl = document.getElementById('summaryDuration');

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
    durTxt += ' • ' + blocksCount + (blocksCount === 1 ? ' janela de 30min' : ' janelas de 30min');

    if (timeEl) timeEl.textContent = sStr + ' às ' + eStr;
    if (durEl) durEl.textContent = durTxt;
  };
`;

const jsStartIdx = content.indexOf(oldJsStart);
const jsEndIdx = content.indexOf(oldJsEnd);

if (jsStartIdx !== -1 && jsEndIdx !== -1) {
  content = content.slice(0, jsStartIdx) + newJs + '\n\n  ' + content.slice(jsEndIdx);
  console.log('Slots JavaScript functions replaced with Scheduled Games & Smart Auto-Selection.');
} else {
  console.error('Could not locate old JS section in admin.html');
}

// 3. Update openDirectBookingModal so it picks a free 1-hour slot instead of defaulting to 06:00-23:30
const oldOpenModalPattern = /window\.openDirectBookingModal = function\(\) {[\s\S]*?modal\.classList\.remove\('hidden'\);/;
const newOpenModal = `window.openDirectBookingModal = function() {
    const modal = document.getElementById('directBookingModal');
    if (!modal) return;
    const dateInput = document.getElementById('directBookingDate');
    const courtSelect = document.getElementById('directBookingCourt');
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');

    if (dateInput) {
      dateInput.value = window.adminGameState.selectedDate || '2026-11-04';
    }

    // Inicializa com um horário livre inteligente (1 hora)
    if (typeof findFirstAvailableSlot === 'function' && startSelect && endSelect) {
      const free = findFirstAvailableSlot();
      startSelect.value = free.start;
      endSelect.value = free.end;
    }

    autoCalculateDirectBookingPrice();
    if (courtSelect) {
      courtSelect.onchange = function() { 
        if (typeof findFirstAvailableSlot === 'function' && startSelect && endSelect) {
          const free = findFirstAvailableSlot();
          startSelect.value = free.start;
          endSelect.value = free.end;
        }
        autoCalculateDirectBookingPrice(); 
        renderBalcaoTimeSlots(); 
      };
    }
    if (dateInput) {
      dateInput.onchange = function() { 
        if (typeof findFirstAvailableSlot === 'function' && startSelect && endSelect) {
          const free = findFirstAvailableSlot();
          startSelect.value = free.start;
          endSelect.value = free.end;
        }
        autoCalculateDirectBookingPrice(); 
        renderBalcaoTimeSlots(); 
      };
    }
    renderBalcaoTimeSlots();
    modal.classList.remove('hidden');`;

if (content.includes('window.openDirectBookingModal = function() {')) {
  content = content.replace(oldOpenModalPattern, newOpenModal);
  console.log('openDirectBookingModal updated with smart 1-hour free slot picker.');
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('Saved public/admin.html.');
