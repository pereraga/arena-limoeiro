const fs = require('fs');
const repoRoot = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system';
const filePath = repoRoot + '/public/admin.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. In pullDataFromCloudDatabases, always call renderMovementMatches() on first completion
const pullTarget = `      // Só re-renderiza se houve alteração REAL nos dados!
      if (stateChanged) {
        if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();
        if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();
        // Atualiza apenas os contadores numéricos sem reconstruir o DOM da régua para nunca resetar o scroll da tela
        if (typeof window.updateMovementCalendarStrip === 'function') window.updateMovementCalendarStrip();
        if (typeof window.renderCadastrosBookingsList === 'function') window.renderCadastrosBookingsList();
        if (typeof window.renderCadastrosClientes === 'function') window.renderCadastrosClientes();
      }`;

const pullReplacement = `      // Re-renderiza se houve alteração real OU se for a primeira carga da página para limpar o spinner
      if (stateChanged || !window.__hasCompletedFirstPull) {
        window.__hasCompletedFirstPull = true;
        if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();
        if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();
        if (typeof window.updateMovementCalendarStrip === 'function') window.updateMovementCalendarStrip();
        if (typeof window.renderCadastrosBookingsList === 'function') window.renderCadastrosBookingsList();
        if (typeof window.renderCadastrosClientes === 'function') window.renderCadastrosClientes();
      }`;

if (!content.includes(pullTarget)) {
  console.error('pullTarget not found!');
  process.exit(1);
}
content = content.replace(pullTarget, pullReplacement);

// 2. In initAdminGames, add window.renderMovementMatches() and remove any stuck spinner immediately
const initTarget = `    // Seleciona o dia atual de forma 100% dinâmica (adaptado à virada do dia)
    const targetDate = window.adminGameState.selectedDate || todayStr;
    window.selectMovementDay(targetDate);

    // Inicializa renderizações do feed e cadastros
    renderMovementMatches();
    renderCadastrosBookingsList();`;

const initReplacement = `    // Seleciona o dia atual de forma 100% dinâmica (adaptado à virada do dia)
    const targetDate = window.adminGameState.selectedDate || todayStr;
    window.selectMovementDay(targetDate);

    // Inicializa renderizações do feed e cadastros com try/catch protetor
    try {
      renderMovementMatches();
    } catch(e) {
      console.warn('[initAdminGames] Erro ao renderizar partidas:', e);
    }
    try {
      renderCadastrosBookingsList();
    } catch(e) {
      console.warn('[initAdminGames] Erro ao renderizar cadastros:', e);
    }`;

if (!content.includes(initTarget)) {
  console.error('initTarget not found!');
  process.exit(1);
}
content = content.replace(initTarget, initReplacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated pullDataFromCloudDatabases and initAdminGames!');
