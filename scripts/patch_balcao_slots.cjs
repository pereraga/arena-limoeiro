const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

// 1. Generate 30-min options for Início and Fim
function generateTimeOptions(startMin, endMin, isPromoCheck = false) {
  let opts = '';
  for (let m = startMin; m <= endMin; m += 30) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;
    const h = Math.floor(m / 60);
    const promo = (isPromoCheck && h >= 9 && h < 16) ? ' (Promo)' : '';
    opts += `            <option value="${timeStr}">${timeStr}${promo}</option>\n`;
  }
  return opts;
}

const startOptions30Min = generateTimeOptions(6 * 60, 23 * 60, true);
const endOptions30Min = generateTimeOptions(6 * 60 + 30, 24 * 60, false);

// 2. Prepare the new Markup for the Time Slots & Inputs
const newTimeSelectionMarkup = `      <!-- SELEÇÃO RÁPIDA DE DURAÇÃO -->
      <div class="sm:col-span-3 flex items-center justify-between p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
        <span class="text-[11px] font-black text-emerald-900 uppercase flex items-center gap-1.5">
          <i data-lucide="clock" class="w-3.5 h-3.5 text-emerald-600"></i>
          <span>Duração Rápida:</span>
        </span>
        <div class="flex items-center gap-1.5 flex-wrap">
          <button type="button" onclick="setDirectBookingDuration(0.5)" class="px-2.5 py-1 text-xs font-black bg-white hover:bg-emerald-600 hover:text-white text-emerald-800 border border-emerald-200 rounded-lg shadow-xs transition cursor-pointer">
            30 min
          </button>
          <button type="button" onclick="setDirectBookingDuration(1)" class="px-2.5 py-1 text-xs font-black bg-white hover:bg-emerald-600 hover:text-white text-emerald-800 border border-emerald-200 rounded-lg shadow-xs transition cursor-pointer">
            1 hora
          </button>
          <button type="button" onclick="setDirectBookingDuration(1.5)" class="px-2.5 py-1 text-xs font-black bg-white hover:bg-emerald-600 hover:text-white text-emerald-800 border border-emerald-200 rounded-lg shadow-xs transition cursor-pointer">
            1h 30min
          </button>
          <button type="button" onclick="setDirectBookingDuration(2)" class="px-2.5 py-1 text-xs font-black bg-white hover:bg-emerald-600 hover:text-white text-emerald-800 border border-emerald-200 rounded-lg shadow-xs transition cursor-pointer">
            2 horas
          </button>
        </div>
      </div>

      <!-- JANELAS SEPARADAS DE HORÁRIOS (SLOTS DE 30 EM 30 MINUTOS) -->
      <div class="space-y-2 p-3.5 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 border border-emerald-200/80 rounded-2xl shadow-xs">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
              <i data-lucide="calendar-check" class="w-3.5 h-3.5"></i>
            </span>
            <div>
              <span class="text-xs font-black text-slate-800 uppercase tracking-tight block">Janelas de Horas Disponíveis (30 em 30 min):</span>
              <span class="text-[10px] text-slate-500 font-medium">Toque nos horários para selecionar ou desmarcar.</span>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <button type="button" onclick="undoLastBalcaoTimeSlot()" title="Voltar última seleção de horário" class="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition">
              <i data-lucide="undo-2" class="w-3 h-3 text-slate-500"></i>
              <span>Voltar Seleção</span>
            </button>
            <button type="button" onclick="resetDirectBookingTimeSlots()" title="Limpar horários selecionados" class="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition">
              <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
              <span>Limpar</span>
            </button>
          </div>
        </div>

        <!-- Grade de Janelas de 30 minutos geradas dinamicamente -->
        <div id="directBookingSlotsGrid" class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
          <!-- Slots de 30min injetados aqui -->
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
            <span class="inline-flex items-center gap-1 text-slate-400 font-medium">
              <span class="w-2.5 h-2.5 rounded-sm bg-slate-200 border border-slate-300"></span> Ocupado
            </span>
          </div>

          <div id="balcaoSlotSelectionSummary" class="text-xs font-bold text-emerald-900 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center gap-1.5">
            <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>Horário: <strong id="summarySelectedTime">19:00 às 20:00</strong> (<span id="summaryDuration">1h</span>)</span>
          </div>
        </div>
      </div>

      <!-- SELEÇÃO NUMÉRICA & VALOR TOTAL -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Início *</label>
          <select id="directBookingStart" onchange="onDirectBookingDropdownChange()" required
                  class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer">
${startOptions30Min}          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Fim *</label>
          <select id="directBookingEnd" onchange="onDirectBookingDropdownChange()" required
                  class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer">
${endOptions30Min}          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Valor Total (R$) *</label>
          <input type="number" id="directBookingPrice" required value="110" step="5" min="0"
                 class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none">
        </div>
      </div>`;

// Find and replace the modal's time section
const oldTimeSectionStart = '<div class="sm:col-span-3 flex items-center justify-between p-2 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">';
const oldTimeSectionEnd = '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">\n        <div>\n          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Pagamento</label>';

const startIdxModal = content.indexOf(oldTimeSectionStart);
const endIdxModal = content.indexOf(oldTimeSectionEnd);

if (startIdxModal !== -1 && endIdxModal !== -1) {
  content = content.slice(0, startIdxModal) + newTimeSelectionMarkup + '\n\n      ' + content.slice(endIdxModal);
  console.log('Direct Booking Modal Time Slots Markup replaced successfully.');
} else {
  console.error('Could not find modal time section boundaries.');
}

// 3. Update JavaScript logic for time slots rendering, selection, undo, and auto-calculation
const newSlotsJs = `
  // =========================================================================
  // GESTÃO DE JANELAS DE HORAS (30 EM 30 MIN) PARA RESERVA DIRETA DE BALCÃO
  // =========================================================================
  window.__balcaoSelectionHistory = [];

  window.renderBalcaoTimeSlots = function() {
    const grid = document.getElementById('directBookingSlotsGrid');
    if (!grid) return;

    const courtSelect = document.getElementById('directBookingCourt');
    const dateInput = document.getElementById('directBookingDate');
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');

    const courtId = courtSelect ? courtSelect.value : 'fut7';
    const dateStr = dateInput ? dateInput.value : (window.adminGameState.selectedDate || '2026-11-04');
    const currentStart = startSelect ? startSelect.value : '19:00';
    const currentEnd = endSelect ? endSelect.value : '20:00';

    const currentStartMin = parseTimeToMinutes(currentStart);
    const currentEndMin = parseTimeToMinutes(currentEnd);

    // Mapeamento de quadra para busca nos dados operacionais
    let dbCourtId = courtId;
    if (courtId === 'fut5') dbCourtId = 'court-esportes-de-quadra-1788962671043';
    if (courtId === 'fut6') dbCourtId = 'court-society-2';
    if (courtId === 'fut7') dbCourtId = 'court-futsal-1788963178368';
    if (courtId === 'society') dbCourtId = 'court-society-1';
    if (courtId === 'areia') dbCourtId = 'court-beach-1';
    if (courtId === 'futmesa') dbCourtId = 'court-futmesa-1';

    // Obter dia da semana para checar mensalistas
    const dateObj = new Date(dateStr + 'T12:00:00');
    const daysMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const dayOfWeek = daysMap[dateObj.getDay()];

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
        if (em > sm) occupiedRanges.push({ start: sm, end: em, desc: b.customer_name || 'Partida' });
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
        occupiedRanges.push({ start: sm, end: effectiveEnd, desc: 'Mensalista: ' + (m.team_name || m.responsible_name || 'Fixo') });
      }
    });

    // Gerar slots de 30 em 30 minutos das 06:00 às 23:00
    let html = '';
    for (let m = 6 * 60; m <= 23 * 60; m += 30) {
      const slotTime = formatMinutesToTime(m);
      const slotNextTime = formatMinutesToTime(m + 30);
      const slotEndMin = m + 30;

      // Verifica se o slot de 30min conflita com algum horário ocupado
      const conflict = occupiedRanges.find(r => Math.max(m, r.start) < Math.min(slotEndMin, r.end));
      const isOccupied = !!conflict;
      const isSelected = (!isOccupied && m >= currentStartMin && slotEndMin <= currentEndMin);

      if (isOccupied) {
        html += '<button type="button" disabled title="Ocupado: ' + (conflict.desc || 'Partida agendada') + ' (' + slotTime + ' às ' + slotNextTime + ')" class="p-2 rounded-xl text-[11px] font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60 line-through text-center transition flex flex-col items-center justify-center">';
        html += '<span class="font-bold">' + slotTime + '</span>';
        html += '<span class="text-[9px] uppercase tracking-tighter">Ocupado</span>';
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

    grid.innerHTML = html;

    // Atualiza o resumo
    updateBalcaoSelectionSummary();
  };

  window.toggleBalcaoTimeSlot = function(slotTime) {
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    if (!startSelect || !endSelect) return;

    // Salva o estado anterior no histórico para poder voltar
    window.__balcaoSelectionHistory = window.__balcaoSelectionHistory || [];
    window.__balcaoSelectionHistory.push({
      start: startSelect.value,
      end: endSelect.value
    });
    if (window.__balcaoSelectionHistory.length > 20) window.__balcaoSelectionHistory.shift();

    const clickedMin = parseTimeToMinutes(slotTime);
    const curStartMin = parseTimeToMinutes(startSelect.value);
    const curEndMin = parseTimeToMinutes(endSelect.value);

    // Se clicar antes do início atual, redefine início
    if (clickedMin < curStartMin) {
      startSelect.value = slotTime;
    } else if (clickedMin >= curEndMin) {
      // Se clicar depois do fim atual, expande o fim para incluir este bloco de 30min
      endSelect.value = formatMinutesToTime(clickedMin + 30);
    } else if (clickedMin === curStartMin && curEndMin - curStartMin > 30) {
      // Se clicar no início e houver mais de 30min, avança o início em 30min (desmarca o bloco inicial)
      startSelect.value = formatMinutesToTime(curStartMin + 30);
    } else if (clickedMin === curEndMin - 30 && curEndMin - curStartMin > 30) {
      // Se clicar no último bloco selecionado, recua o fim em 30min (desmarca o bloco final)
      endSelect.value = formatMinutesToTime(curEndMin - 30);
    } else {
      // Clique simples em um bloco avulso: define início e fim de 1 hora (ou 30 min se preferir)
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
      startSelect.value = '19:00';
      endSelect.value = '20:00';
      autoCalculateDirectBookingPrice();
      renderBalcaoTimeSlots();
      if (typeof window.showNotification === 'function') {
        window.showNotification('Horários redefinidos para o padrão (19:00 às 20:00).');
      }
    }
  };

  window.onDirectBookingDropdownChange = function() {
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    if (!startSelect || !endSelect) return;

    let sMin = parseTimeToMinutes(startSelect.value);
    let eMin = parseTimeToMinutes(endSelect.value);

    // Garante que o fim seja pelo menos 30 min após o início
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

// Insert the newSlotsJs right before window.openDirectBookingModal
const markerModalOpen = 'window.openDirectBookingModal = function() {';
const modalOpenIdx = content.indexOf(markerModalOpen);

if (modalOpenIdx !== -1) {
  content = content.slice(0, modalOpenIdx) + newSlotsJs + '\n\n  ' + content.slice(modalOpenIdx);
  console.log('Slots JavaScript functions added successfully.');
}

// Update autoCalculateDirectBookingPrice to handle 30-min intervals accurately
const oldCalcStart = 'window.autoCalculateDirectBookingPrice = function() {';
const oldCalcEnd = 'window.handleSaveDirectBooking = async function(e) {';
const newCalcJs = `window.autoCalculateDirectBookingPrice = function() {
    const courtSelect = document.getElementById('directBookingCourt');
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    const priceInput = document.getElementById('directBookingPrice');
    if (!courtSelect || !priceInput) return;

    const cId = courtSelect.value;
    const court = ADMIN_COURTS.find(c => c.id === cId) || ADMIN_COURTS[0];

    const sStr = startSelect ? startSelect.value : '19:00';
    const eStr = endSelect ? endSelect.value : '20:00';
    const sMin = parseTimeToMinutes(sStr);
    let eMin = parseTimeToMinutes(eStr);
    if (eMin <= sMin) eMin = sMin + 30;

    const durationHours = (eMin - sMin) / 60;
    const sH = Math.floor(sMin / 60);

    const isPromo = sH >= 9 && sH < 16;
    const hourlyRate = isPromo ? (court.promo || 50) : (court.normal || 90);
    priceInput.value = Math.round(hourlyRate * durationHours);
  };`;

const calcStartIdx = content.indexOf(oldCalcStart);
const calcEndIdx = content.indexOf(oldCalcEnd);
if (calcStartIdx !== -1 && calcEndIdx !== -1) {
  content = content.slice(0, calcStartIdx) + newCalcJs + '\n\n  ' + content.slice(calcEndIdx);
  console.log('autoCalculateDirectBookingPrice updated to handle 30-min fractions.');
}

// Update openDirectBookingModal to also call renderBalcaoTimeSlots() and set listeners on court and date
content = content.replace(
  'autoCalculateDirectBookingPrice();\n    modal.classList.remove(\'hidden\');',
  `autoCalculateDirectBookingPrice();
    const courtSelect = document.getElementById('directBookingCourt');
    if (courtSelect) {
      courtSelect.onchange = function() { autoCalculateDirectBookingPrice(); renderBalcaoTimeSlots(); };
    }
    if (dateInput) {
      dateInput.onchange = function() { autoCalculateDirectBookingPrice(); renderBalcaoTimeSlots(); };
    }
    renderBalcaoTimeSlots();
    modal.classList.remove('hidden');`
);

// Update setDirectBookingDuration to handle 30-min increments and re-render slots
const oldSetDurationJs = `  window.setDirectBookingDuration = function(hours) {
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    if (!startSelect || !endSelect) return;

    const startTime = startSelect.value || '19:00';
    const sMin = parseTimeToMinutes(startTime);
    const durMin = Math.round(hours * 60);
    const newEnd = formatMinutesToTime(sMin + durMin);

    // Se o select de fim tiver essa opção, seleciona; se não, cria temporariamente
    let opt = Array.from(endSelect.options).find(o => o.value === newEnd);
    if (!opt) {
      opt = new Option(newEnd, newEnd);
      endSelect.add(opt);
    }
    endSelect.value = newEnd;

    // Recalcular preço
    if (window.autoCalculateDirectBookingPrice) {
      window.autoCalculateDirectBookingPrice();
    }
  };`;

const newSetDurationJs = `  window.setDirectBookingDuration = function(hours) {
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    if (!startSelect || !endSelect) return;

    window.__balcaoSelectionHistory = window.__balcaoSelectionHistory || [];
    window.__balcaoSelectionHistory.push({ start: startSelect.value, end: endSelect.value });

    const startTime = startSelect.value || '19:00';
    const sMin = parseTimeToMinutes(startTime);
    const durMin = Math.round(hours * 60);
    const newEnd = formatMinutesToTime(sMin + durMin);

    let opt = Array.from(endSelect.options).find(o => o.value === newEnd);
    if (!opt) {
      opt = new Option(newEnd, newEnd);
      endSelect.add(opt);
    }
    endSelect.value = newEnd;

    if (window.autoCalculateDirectBookingPrice) {
      window.autoCalculateDirectBookingPrice();
    }
    if (typeof window.renderBalcaoTimeSlots === 'function') {
      window.renderBalcaoTimeSlots();
    }
  };`;

if (content.includes(oldSetDurationJs)) {
  content = content.replace(oldSetDurationJs, newSetDurationJs);
  console.log('setDirectBookingDuration updated to support 30min and re-render slots.');
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('Saved public/admin.html.');
