const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

console.log('Original content length:', content.length);

// 1. Line 6226: in pullDataFromCloudDatabases
const target1 = `      if (stateChanged) {
        if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();
        if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();
        if (typeof window.updateMovementCalendarStrip === 'function') window.updateMovementCalendarStrip();
        if (typeof window.renderMovementCalendarStrip === 'function') window.renderMovementCalendarStrip();
        if (typeof window.renderCadastrosBookingsList === 'function') window.renderCadastrosBookingsList();
        if (typeof window.renderCadastrosClientes === 'function') window.renderCadastrosClientes();
      }`;

const replace1 = `      if (stateChanged) {
        if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();
        if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();
        // Atualiza apenas os contadores numéricos sem reconstruir o DOM da régua para nunca resetar o scroll da tela
        if (typeof window.updateMovementCalendarStrip === 'function') window.updateMovementCalendarStrip();
        if (typeof window.renderCadastrosBookingsList === 'function') window.renderCadastrosBookingsList();
        if (typeof window.renderCadastrosClientes === 'function') window.renderCadastrosClientes();
      }`;

if (content.includes(target1)) {
  content = content.replace(target1, replace1);
  console.log('[1/4] Fixed cloud polling re-render to avoid unnecessary strip redraw');
} else {
  console.warn('[1/4] Target 1 not found');
}

// 2. Line 7634: inside finishMatch
const target2 = `      const nextEl = document.getElementById('card-' + next.id);
      if (nextEl) {
        nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nextEl.style.transition = 'box-shadow 0.4s ease';
        nextEl.style.boxShadow = '0 0 0 3px #10b981, 0 10px 25px -5px rgba(16, 185, 129, 0.35)';
        setTimeout(() => {
          if (nextEl) nextEl.style.boxShadow = '';
        }, 4000);
      }`;

const replace2 = `      const nextEl = document.getElementById('card-' + next.id);
      if (nextEl) {
        nextEl.style.transition = 'box-shadow 0.4s ease';
        nextEl.style.boxShadow = '0 0 0 3px #10b981, 0 10px 25px -5px rgba(16, 185, 129, 0.35)';
        setTimeout(() => {
          if (nextEl) nextEl.style.boxShadow = '';
        }, 4000);
      }`;

if (content.includes(target2)) {
  content = content.replace(target2, replace2);
  console.log('[2/4] Removed vertical scrollIntoView in card focus');
} else {
  console.warn('[2/4] Target 2 not found');
}

// 3. Line 9052: inside renderMovementCalendarStrip
const target3 = `    // Faz scroll suave até o dia selecionado
    setTimeout(() => {
      const activeCard = strip.querySelector(\`[data-date="\${selectedDate}"]\`);
      if (activeCard && typeof activeCard.scrollIntoView === 'function') {
        activeCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }, 50);`;

const replace3 = `    // Faz scroll suave horizontal seguro DENTRO do container da régua SEM mexer no scroll vertical da página
    setTimeout(() => {
      const activeCard = strip.querySelector(\`[data-date="\${selectedDate}"]\`);
      if (activeCard) {
        const targetLeft = activeCard.offsetLeft - (strip.clientWidth / 2) + (activeCard.offsetWidth / 2);
        strip.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
      }
    }, 50);`;

if (content.includes(target3)) {
  content = content.replace(target3, replace3);
  console.log('[3/4] Replaced calendar strip scrollIntoView with horizontal-only scrollTo');
} else {
  console.warn('[3/4] Target 3 not found');
}

// 4. Line 9143: inside selectMovementDay
const target4 = `      if (btnEl && typeof btnEl.scrollIntoView === 'function') {
        btnEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }`;

const replace4 = `      if (btnEl && strip) {
        const targetLeft = btnEl.offsetLeft - (strip.clientWidth / 2) + (btnEl.offsetWidth / 2);
        strip.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
      }`;

if (content.includes(target4)) {
  content = content.replace(target4, replace4);
  console.log('[4/4] Replaced selectMovementDay scrollIntoView with horizontal-only scrollTo');
} else {
  console.warn('[4/4] Target 4 not found');
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('Updated public/admin.html successfully. New size:', content.length);
