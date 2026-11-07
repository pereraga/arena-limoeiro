const fs = require('fs');
const path = require('path');

const adminHtmlPath = path.join(__dirname, '..', 'public', 'admin.html');
let html = fs.readFileSync(adminHtmlPath, 'utf8');

const startMarker = 'window.toggleBalcaoTimeSlot = function(slotTime) {';
const endMarker = 'window.undoLastBalcaoTimeSlot = function() {';

const startIdx = html.indexOf(startMarker);
const endIdx = html.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found! start:', startIdx, 'end:', endIdx);
  process.exit(1);
}

const newToggleCode = [
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
  '    // Salva histórico para botão Voltar',
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
  '    // Fluxo em 2 passos cristalino e ultra-responsivo:',
  '    // Se estamos aguardando o clique do fim (awaiting_end):',
  '    if (window.__balcaoClickState === \'awaiting_end\') {',
  '      if (clickedMin === curStartMin) {',
  '        // Clicou novamente no mesmo horário de início: confirma meia hora (ex: 12:00 às 12:30)',
  '        endSelect.value = formatMinutesToTime(curStartMin + 30);',
  '        window.__balcaoClickState = \'range_selected\';',
  '      } else if (clickedMin > curStartMin && !hasConflict(curStartMin, clickedMin)) {',
  '        // Clicou em um horário à frente (ex: 12:30 para fechar 30min ou 13:00 para fechar 1h):',
  '        // Define o término exatamente no horário clicado!',
  '        endSelect.value = slotTime;',
  '        window.__balcaoClickState = \'range_selected\';',
  '      } else {',
  '        // Conflito ou clicou em horário anterior: inicia novo ponto de início imediatamente no horário clicado',
  '        startSelect.value = slotTime;',
  '        endSelect.value = formatMinutesToTime(clickedMin + 30);',
  '        window.__balcaoClickState = \'awaiting_end\';',
  '      }',
  '    } else {',
  '      // Estado inicial ou intervalo já selecionado:',
  '      // 1º clique: define o início no horário clicado de primeira, já deixando 30min preparados',
  '      startSelect.value = slotTime;',
  '      endSelect.value = formatMinutesToTime(clickedMin + 30);',
  '      window.__balcaoClickState = \'awaiting_end\';',
  '    }',
  '',
  '    autoCalculateDirectBookingPrice();',
  '    renderBalcaoTimeSlots();',
  '  };',
  '',
  '  '
].join('\n');

html = html.substring(0, startIdx) + newToggleCode + html.substring(endIdx);
console.log('toggleBalcaoTimeSlot replaced successfully');

// Também garante que openDirectBookingModal reseta o estado
const resetStateSnippet = 'window.__balcaoClickState = null;';
if (!html.includes('window.__balcaoClickState = null;')) {
  html = html.replace(
    'window.openDirectBookingModal = function() {',
    'window.openDirectBookingModal = function() {\n    window.__balcaoClickState = null;'
  );
  console.log('openDirectBookingModal reset state added');
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
