const fs = require('fs');
const vm = require('vm');

const adminHtml = fs.readFileSync('public/admin.html', 'utf8');
const scriptMatches = [...adminHtml.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi)];
const lastScript = scriptMatches[scriptMatches.length - 1][1];

const domElements = {};
function createMockElement(id) {
  const el = {
    id,
    value: 'all',
    textContent: '',
    innerText: '',
    innerHTML: '',
    style: { display: 'none' },
    classList: {
      _classes: new Set(['hidden']),
      contains: function(c) { return this._classes.has(c); },
      add: function(c) { this._classes.add(c); },
      remove: function(c) { this._classes.delete(c); }
    },
    children: [],
    querySelectorAll: function() { return []; },
    querySelector: function() { return { textContent: '' }; },
    scrollIntoView: function() {},
    setAttribute: function(k, v) { this[k] = v; },
    getAttribute: function(k) { return this[k]; }
  };
  return el;
}

const context = {
  window: {
    location: { search: '', hash: '', href: 'https://arenalimoeiro.vercel.app/admin' }
  },
  location: { search: '', hash: '', href: 'https://arenalimoeiro.vercel.app/admin' },
  document: {
    getElementById: (id) => {
      if (!domElements[id]) domElements[id] = createMockElement(id);
      return domElements[id];
    },
    querySelectorAll: () => [],
    querySelector: () => null,
    addEventListener: () => {},
    readyState: 'complete'
  },
  console: console,
  localStorage: { getItem: () => null, setItem: () => null },
  fetch: () => Promise.resolve({ ok: false }),
  performance: { now: () => Date.now() },
  setInterval: () => {},
  setTimeout: (fn) => fn()
};
context.window.document = context.document;
context.window.localStorage = context.localStorage;
context.window.console = context.console;

const defaultData = fs.readFileSync('public/default-data.js', 'utf8');
vm.createContext(context);
vm.runInContext(defaultData, context);
vm.runInContext(lastScript, context);

console.log('--- TEST 1: Initial state of openDetailsIds ---');
console.log('openDetailsIds size:', context.window.__openDetailsIds ? context.window.__openDetailsIds.size : 0);

console.log('\n--- TEST 2: User clicks "Detalhes e ações" for match ARENA-2546 ---');
const matchId = 'ARENA-2546';
// Get mock element and call toggleDetails
const detailsEl = context.document.getElementById('details-' + matchId);
const arrowEl = context.document.getElementById('arrow-details-' + matchId);

context.window.toggleDetails(matchId);

console.log('detailsEl.style.display:', detailsEl.style.display);
console.log('detailsEl has class hidden:', detailsEl.classList.contains('hidden'));
console.log('arrowEl textContent:', arrowEl.textContent);
console.log('openDetailsIds contains ARENA-2546:', context.window.__openDetailsIds.has(matchId));

if (detailsEl.style.display === 'block' && !detailsEl.classList.contains('hidden') && context.window.__openDetailsIds.has(matchId)) {
  console.log('✓ PASS: Panel opened and recorded in persistent state!');
} else {
  console.error('❌ FAIL: Panel did not open properly');
}

console.log('\n--- TEST 3: Background auto-sync runs renderMatchCardHtml ---');
const matches = context.window.getMatchesForDate('2026-11-04');
const daviMatch = matches.find(m => m.id === matchId || m.customer_name === 'Davi');

// Render card HTML
const cardHtml = context.window.renderMatchCardHtml(daviMatch, false);

console.log('Card HTML includes display:block on panel:', cardHtml.includes('id="details-ARENA-2546" style="display:block;"'));
console.log('Card HTML includes arrow ▴:', cardHtml.includes('id="arrow-details-ARENA-2546">▴</span>'));

if (cardHtml.includes('id="details-ARENA-2546" style="display:block;"') && cardHtml.includes('id="arrow-details-ARENA-2546">▴</span>')) {
  console.log('🎉 100% SUCCESS: Details panel stays OPEN even across full re-renders and auto-sync intervals!');
} else {
  console.error('❌ FAIL: Panel was not preserved as open during re-render');
}

console.log('\n--- TEST 4: User clicks again to close ---');
context.window.toggleDetails(matchId);
console.log('detailsEl.style.display after 2nd click:', detailsEl.style.display);
console.log('openDetailsIds has matchId:', context.window.__openDetailsIds.has(matchId));
const cardHtmlClosed = context.window.renderMatchCardHtml(daviMatch, false);
console.log('Card HTML includes display:none on panel:', cardHtmlClosed.includes('id="details-ARENA-2546" style="display:none;"'));

if (cardHtmlClosed.includes('style="display:none;"') && !context.window.__openDetailsIds.has(matchId)) {
  console.log('✓ PASS: Panel closes cleanly when toggled by the user!');
} else {
  console.error('❌ FAIL: Panel did not close properly');
}
