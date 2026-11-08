const fs = require('fs');
const path = require('path');
const vm = require('vm');

const filePath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('[Refine] Applying auto-start/expire and render cleanups...');

// 1. In checkAndAutoExpireMatches, remove duplicate renderMovementMatches/renderCadastrosBookingsList
const oldExpireBlock = `      if (hasChangedAny) {
        try {
          localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));
        } catch(e) {}
        if (typeof window.saveAdminGameState === 'function') window.saveAdminGameState();
        if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();
        if (typeof window.renderCadastrosBookingsList === 'function') window.renderCadastrosBookingsList();
      }`;

const newExpireBlock = `      if (hasChangedAny) {
        try {
          localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));
        } catch(e) {}
        if (typeof window.saveAdminGameState === 'function') window.saveAdminGameState();
      }`;

if (content.includes(oldExpireBlock)) {
  content = content.replace(oldExpireBlock, newExpireBlock);
  console.log('[Refine] 1. checkAndAutoExpireMatches duplicate renders removed.');
} else {
  console.warn('[Refine] Warning: oldExpireBlock not found exactly.');
}

// 2. In checkAndAutoStartMatches, remove duplicate renderMovementMatches/renderCadastrosBookingsList
const oldStartBlock = `      if (hasAutoStartedAny) {
        try {
          localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));
        } catch(e) {}
        if (typeof window.saveAdminGameState === 'function') window.saveAdminGameState();
        if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();
        if (typeof window.renderCadastrosBookingsList === 'function') window.renderCadastrosBookingsList();
      }`;

const newStartBlock = `      if (hasAutoStartedAny) {
        try {
          localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));
        } catch(e) {}
        if (typeof window.saveAdminGameState === 'function') window.saveAdminGameState();
      }`;

if (content.includes(oldStartBlock)) {
  content = content.replace(oldStartBlock, newStartBlock);
  console.log('[Refine] 2. checkAndAutoStartMatches duplicate renders removed.');
} else {
  console.warn('[Refine] Warning: oldStartBlock not found exactly.');
}

// 3. Clear cache before calculating allMatches in renderMovementMatches
const oldRenderMatchesStart = `    // Auto-início e auto-encerramento/cancelamento de partidas após o horário
    if (typeof window.checkAndAutoStartMatches === 'function') {
      window.checkAndAutoStartMatches();
    }
    if (typeof window.checkAndAutoExpireMatches === 'function') {
      window.checkAndAutoExpireMatches();
    }

    // Recupera TODAS as partidas do dia para estatísticas completas
    const allMatches = getMatchesForDate(dateStr);`;

const newRenderMatchesStart = `    // Auto-início e auto-encerramento/cancelamento de partidas após o horário
    if (typeof window.checkAndAutoStartMatches === 'function') {
      window.checkAndAutoStartMatches();
    }
    if (typeof window.checkAndAutoExpireMatches === 'function') {
      window.checkAndAutoExpireMatches();
    }

    if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();

    // Recupera TODAS as partidas do dia para estatísticas completas
    const allMatches = getMatchesForDate(dateStr);`;

if (content.includes(oldRenderMatchesStart)) {
  content = content.replace(oldRenderMatchesStart, newRenderMatchesStart);
  console.log('[Refine] 3. renderMovementMatches cache invalidation placed.');
} else {
  console.warn('[Refine] Warning: oldRenderMatchesStart not found exactly.');
}

fs.writeFileSync(filePath, content, 'utf8');

// Validate syntax
const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(content)) !== null) {
  count++;
  try {
    new vm.Script(match[1]);
  } catch (err) {
    console.error(`Syntax error in <script> block ${count}:`, err.message);
    process.exit(1);
  }
}

console.log(`[Refine] ALL ${count} script blocks validated successfully!`);
