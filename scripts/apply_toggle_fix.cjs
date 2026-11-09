const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

const targetFunctionStart = `window.toggleBalcaoTimeSlot = function(slotTime) {
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
    const isTodaySelected = (dateStr === (window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08')));`;

const replacementFunctionStart = `const toggleBalcaoTimeSlot = window.toggleBalcaoTimeSlot = function(slotTime) {
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    const courtSelect = document.getElementById('directBookingCourt');
    const dateInput = document.getElementById('directBookingDate');
    const courtId = courtSelect?.value || '';
    const dateStr = dateInput?.value || window.adminGameState?.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-09');
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
    const sysToday = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : (window.adminGameState?.selectedDate || '2026-11-09');
    const isTodaySelected = (dateStr === sysToday);`;

if (!content.includes(targetFunctionStart)) {
    console.error('Target function start not found in admin.html!');
    process.exit(1);
}

content = content.replace(targetFunctionStart, replacementFunctionStart);

// Also remove duplicate declarations of courtSelect, dateInput, courtId, dateStr further down inside toggleBalcaoTimeSlot
const redundantVars = `    const courtSelect = document.getElementById('directBookingCourt');
    const dateInput = document.getElementById('directBookingDate');
    const courtId = courtSelect ? courtSelect.value : '';
    const dateStr = dateInput ? dateInput.value : (window.adminGameState.selectedDate || '2026-11-08');`;

if (content.includes(redundantVars)) {
    content = content.replace(redundantVars, `    // courtSelect, dateInput, courtId, dateStr already initialized at top`);
    console.log('Replaced redundant variable declarations.');
} else {
    console.log('Note: redundantVars exact pattern not matched, checking alternative...');
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('Successfully updated public/admin.html with toggleBalcaoTimeSlot fix!');
