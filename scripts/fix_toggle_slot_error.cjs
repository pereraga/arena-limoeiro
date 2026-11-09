const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

// 1. Corrigir ReferenceError: dateStr is not defined em toggleBalcaoTimeSlot
// e garantir captura correta de dateStr e validação de horário
const oldToggleStart = `  // Alterna e define intervalos de horários com precisão pelo calendário
  window.toggleBalcaoTimeSlot = function(slotTime) {
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    if (!startSelect || !endSelect) return;

    // Helper: força o valor no select, criando a opção se necessário
    const forceSelectValue = (sel, val) => {
      if (!sel || !val) return;
      let opt = Array.from(sel.options).find(o => o.value === val);
      if (!opt) {
        opt = new Option(val, val);
        sel.add(opt);
      }
      sel.value = val;
    };

    const hasExistingSelection = (startSelect.value !== '' && endSelect.value !== '');
    const clickedMin = parseTimeToMinutes(slotTime);

    // Validação estrita: Não permite selecionar horário igual ou anterior ao horário atual hoje
    const nowCheck = new Date();
    const curNowMins = nowCheck.getHours() * 60 + nowCheck.getMinutes();
    const isTodaySelected = (dateStr === (window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08')));
    if (isTodaySelected && clickedMin <= curNowMins) {
      if (typeof arenaToast === 'function') {
        arenaToast('Horário ' + slotTime + ' indisponível! Selecione um horário adiantado a partir de agora.');
      }
      return;
    }
    let curStartMin = hasExistingSelection ? parseTimeToMinutes(startSelect.value) : -1;
    let curEndMin = hasExistingSelection ? parseTimeToMinutes(endSelect.value) : -1;
    const courtSelect = document.getElementById('directBookingCourt');
    const dateInput = document.getElementById('directBookingDate');
    const courtId = courtSelect ? courtSelect.value : 'fut7';
    const dateStr = dateInput ? dateInput.value : (window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08'));
    const occupiedRanges = window.getBalcaoOccupiedRanges ? window.getBalcaoOccupiedRanges(courtId, dateStr) : [];`;

const newToggleStart = `  // Alterna e define intervalos de horários com precisão pelo calendário
  const toggleBalcaoTimeSlot = window.toggleBalcaoTimeSlot = function(slotTime) {
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    const courtSelect = document.getElementById('directBookingCourt');
    const dateInput = document.getElementById('directBookingDate');
    if (!startSelect || !endSelect) return;

    const courtId = courtSelect ? courtSelect.value : 'fut7';
    const dateStr = dateInput ? dateInput.value : (window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08'));
    const occupiedRanges = window.getBalcaoOccupiedRanges ? window.getBalcaoOccupiedRanges(courtId, dateStr) : [];

    // Helper: força o valor no select, criando a opção se necessário
    const forceSelectValue = (sel, val) => {
      if (!sel || !val) return;
      let opt = Array.from(sel.options).find(o => o.value === val);
      if (!opt) {
        opt = new Option(val, val);
        sel.add(opt);
      }
      sel.value = val;
    };

    const hasExistingSelection = (startSelect.value !== '' && endSelect.value !== '');
    const clickedMin = parseTimeToMinutes(slotTime);

    // Validação estrita: Não permite selecionar horário igual ou anterior ao horário atual hoje
    const nowCheck = new Date();
    const curNowMins = nowCheck.getHours() * 60 + nowCheck.getMinutes();
    const isTodaySelected = (dateStr === (window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08')));
    if (isTodaySelected && clickedMin <= curNowMins) {
      if (typeof arenaToast === 'function') {
        arenaToast('Horário ' + slotTime + ' indisponível! Selecione um horário adiantado a partir de agora.');
      }
      return;
    }

    let curStartMin = hasExistingSelection ? parseTimeToMinutes(startSelect.value) : -1;
    let curEndMin = hasExistingSelection ? parseTimeToMinutes(endSelect.value) : -1;`;

if (html.includes(oldToggleStart)) {
  html = html.replace(oldToggleStart, newToggleStart);
  console.log('1. toggleBalcaoTimeSlot corrigido com dateStr antes do uso e alias local.');
} else {
  console.log('1. oldToggleStart não encontrado diretamente, verificando...');
}

// 2. Garantir que duration do novo booking seja a duração real calculada
const oldDuration = `      time: start + ' às ' + end,
      duration: 60,`;

const newDuration = `      time: start + ' às ' + end,
      duration: (parseTimeToMinutes(end) - parseTimeToMinutes(start)) > 0 ? (parseTimeToMinutes(end) - parseTimeToMinutes(start)) : 60,`;

if (html.includes(oldDuration)) {
  html = html.replace(oldDuration, newDuration);
  console.log('2. duration calculada dinamicamente com base em end - start.');
}

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('public/admin.html atualizado.');
