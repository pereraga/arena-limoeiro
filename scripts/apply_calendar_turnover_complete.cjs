const fs = require('fs');

let content = fs.readFileSync('public/admin.html', 'utf8');

// 1. Fix initAdminGames
const idxInitStart = content.indexOf('function initAdminGames() {');
const idxInitEnd = content.indexOf('renderMovementMatches();', idxInitStart);

if (idxInitStart !== -1 && idxInitEnd !== -1) {
  const newInitCode = `function initAdminGames() {
    const todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-04';
    window.__lastKnownSystemDate = todayStr;

    // Renderiza a régua de dias dinamicamente centrada no dia de hoje
    if (typeof window.renderMovementCalendarStrip === 'function') {
      window.renderMovementCalendarStrip();
    }

    // Seleciona o dia atual de forma 100% dinâmica (adaptado à virada do dia)
    const targetDate = window.adminGameState.selectedDate || todayStr;
    window.selectMovementDay(targetDate);

    // Inicializa renderizações do feed e cadastros
    renderMovementMatches();`;

  content = content.slice(0, idxInitStart) + newInitCode + content.slice(idxInitEnd + 'renderMovementMatches();'.length);
  console.log('✓ Successfully updated initAdminGames to dynamic initialization');
} else {
  console.error('❌ Failed to locate initAdminGames block');
}

// 2. Fix renderMovementMatches fallback date
const targetOldFallback = "const dateStr = window.adminGameState.selectedDate || '2026-11-03';";
const targetNewFallback = "const dateStr = window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-04');";

if (content.includes(targetOldFallback)) {
  content = content.replace(targetOldFallback, targetNewFallback);
  console.log('✓ Updated renderMovementMatches fallback date');
} else {
  console.log('Note: targetOldFallback already updated or not found');
}

fs.writeFileSync('public/admin.html', content, 'utf8');
console.log('✓ Saved public/admin.html successfully');
