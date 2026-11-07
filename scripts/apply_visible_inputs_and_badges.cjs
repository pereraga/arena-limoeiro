const fs = require('fs');
const path = require('path');

const adminHtmlPath = path.join(__dirname, '..', 'public', 'admin.html');
let html = fs.readFileSync(adminHtmlPath, 'utf8');

console.log('1. Making Horário de Início and Horário de Término visibly accessible...');

const hiddenInputStart = '<!-- INPUTS DE INÍCIO E FIM (OCULTOS - CONTROLADOS PELAS JANELAS DE 30 MIN) -->\n      <div style="display:none;" aria-hidden="true">';
const visibleInputReplacement = `<!-- SELEÇÃO VISÍVEL E CONFIRMAÇÃO DE HORÁRIO DE INÍCIO E FIM -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl">
        <div>
          <label class="block text-xs font-black text-slate-700 uppercase tracking-tight mb-1 flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Horário de Início *
          </label>
          <div class="relative">
            <select id="directBookingStart" onchange="onDirectBookingDropdownChange()" required
                    class="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-black text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer shadow-xs">`;

if (html.includes(hiddenInputStart)) {
  html = html.replace(hiddenInputStart, visibleInputReplacement);
  // Also fix the end select styling so both inputs look clean and modern
  html = html.replace(
    '<select id="directBookingEnd" onchange="onDirectBookingDropdownChange()" required>',
    `</div>
        </div>
        <div>
          <label class="block text-xs font-black text-slate-700 uppercase tracking-tight mb-1 flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-700"></span> Horário de Término *
          </label>
          <div class="relative">
            <select id="directBookingEnd" onchange="onDirectBookingDropdownChange()" required
                    class="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-black text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer shadow-xs">`
  );
  // Close the relative div before the closing div of the grid
  html = html.replace(
    '<option value="23:59">23:59</option>\n        </select>\n      </div>',
    '<option value="23:59">23:59</option>\n            </select>\n          </div>\n        </div>\n      </div>'
  );
  console.log('  -> Inputs converted to visible successfully');
} else {
  console.warn('  -> Warning: hiddenInputStart not matched exactly, checking variants...');
}

console.log('2. Updating badge logic in renderBalcaoTimeSlots (distinguish 30-min start/end vs multi-hour ranges)...');

// In-place badge update
const oldInPlaceBadge = `          if (isSelected) {
            const isStart = (m === currentStartMin);
            const isEnd = (slotEndMin === currentEndMin);
            const badgeLabel = isStart ? 'Início' : (isEnd ? 'Fim' : '✓ Selec.');`;

const newInPlaceBadge = `          if (isSelected) {
            const isStart = (m === currentStartMin);
            const isEnd = (slotEndMin === currentEndMin);
            const isSingleSlot = (currentEndMin - currentStartMin === 30);
            const badgeLabel = isSingleSlot ? 'Início/Fim' : (isStart ? 'Início' : (isEnd ? 'Fim' : '✓ Selec.'));`;

html = html.replace(oldInPlaceBadge, newInPlaceBadge);

// Full-build badge update
const oldFullBadge = `      } else if (isSelected) {
        const isStart = (m === currentStartMin);
        const isEnd = (slotEndMin === currentEndMin);
        const badgeLabel = isStart ? 'Início' : (isEnd ? 'Fim' : '✓ Selec.');`;

const newFullBadge = `      } else if (isSelected) {
        const isStart = (m === currentStartMin);
        const isEnd = (slotEndMin === currentEndMin);
        const isSingleSlot = (currentEndMin - currentStartMin === 30);
        const badgeLabel = isSingleSlot ? 'Início/Fim' : (isStart ? 'Início' : (isEnd ? 'Fim' : '✓ Selec.'));`;

html = html.replace(oldFullBadge, newFullBadge);

console.log('3. Updating toggleBalcaoTimeSlot for seamless 1-click and 2-click interaction...');

const oldToggleCodeStart = 'window.toggleBalcaoTimeSlot = function(slotTime) {';
const oldToggleCodeEnd = 'window.undoLastBalcaoTimeSlot = function() {';
const startIdx = html.indexOf(oldToggleCodeStart);
const endIdx = html.indexOf(oldToggleCodeEnd);

if (startIdx !== -1 && endIdx !== -1) {
  const newToggleFunction = [
    'window.toggleBalcaoTimeSlot = function(slotTime) {',
    '    const startSelect = document.getElementById(\'directBookingStart\');',
    '    const endSelect = document.getElementById(\'directBookingEnd\');',
    '    if (!startSelect || !endSelect) return;',
    '',
    '    const clickedMin = parseTimeToMinutes(slotTime);',
    '    let curStartMin = parseTimeToMinutes(startSelect.value);',
    '    let curEndMin = parseTimeToMinutes(endSelect.value);',
    '    const occupiedRanges = window.getBalcaoOccupiedRanges ? window.getBalcaoOccupiedRanges() : [];',
    '',
    '    window.__balcaoSelectionHistory = window.__balcaoSelectionHistory || [];',
    '    window.__balcaoSelectionHistory.push({ start: startSelect.value, end: endSelect.value, state: window.__balcaoClickState });',
    '    if (window.__balcaoSelectionHistory.length > 20) window.__balcaoSelectionHistory.shift();',
    '',
    '    const hasConflict = (fromM, toM) => {',
    '      const s = Math.min(fromM, toM);',
    '      const e = Math.max(fromM, toM);',
    '      return occupiedRanges.some(r => Math.max(s, r.start) < Math.min(e, r.end));',
    '    };',
    '',
    '    // Lógica inteligente de Início e Término:',
    '    // Se estamos aguardando o clique do fim:',
    '    if (window.__balcaoClickState === \'awaiting_end\') {',
    '      if (clickedMin === curStartMin) {',
    '        // Clicou no mesmo slot de início -> alterna entre 30min e 1 hora',
    '        if (curEndMin - curStartMin === 30 && !hasConflict(curStartMin, curStartMin + 60)) {',
    '          endSelect.value = formatMinutesToTime(curStartMin + 60);',
    '        } else {',
    '          endSelect.value = formatMinutesToTime(curStartMin + 30);',
    '        }',
    '        window.__balcaoClickState = \'range_selected\';',
    '      } else if (clickedMin > curStartMin && !hasConflict(curStartMin, clickedMin)) {',
    '        // Clicou no horário de término (ex: início 12:00 -> clicou 12:30 para 30min ou 13:00 para 1h):',
    '        // Se clicou no bloco imediatamente posterior (12:30), fecha em 12:30 (30min)',
    '        // Se clicou em 13:00, fecha em 13:00 (1 hora)',
    '        endSelect.value = slotTime;',
    '        window.__balcaoClickState = \'range_selected\';',
    '      } else if (clickedMin === curStartMin + 30 && !hasConflict(curStartMin, curStartMin + 60)) {',
    '        endSelect.value = formatMinutesToTime(curStartMin + 60);',
    '        window.__balcaoClickState = \'range_selected\';',
    '      } else {',
    '        // Clicou antes ou com conflito: inicia novo início no slot clicado com término de 1h (ou 30min)',
    '        startSelect.value = slotTime;',
    '        const defEnd = !hasConflict(clickedMin, clickedMin + 60) ? (clickedMin + 60) : (clickedMin + 30);',
    '        endSelect.value = formatMinutesToTime(defEnd);',
    '        window.__balcaoClickState = \'awaiting_end\';',
    '      }',
    '    } else {',
    '      // 1º Clique: seleciona o início e já prepara término de 1h (ou 30min se conflito)',
    '      startSelect.value = slotTime;',
    '      const defEnd = !hasConflict(clickedMin, clickedMin + 60) ? (clickedMin + 60) : (clickedMin + 30);',
    '      endSelect.value = formatMinutesToTime(defEnd);',
    '      window.__balcaoClickState = \'awaiting_end\';',
    '    }',
    '',
    '    autoCalculateDirectBookingPrice();',
    '    renderBalcaoTimeSlots();',
    '  };',
    '',
    '  '
  ].join('\n');

  html = html.substring(0, startIdx) + newToggleFunction + html.substring(endIdx);
  console.log('  -> toggleBalcaoTimeSlot updated');
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
