const fs = require('fs');
const vm = require('vm');

const adminHtml = fs.readFileSync('public/admin.html', 'utf8');
const scriptMatches = [...adminHtml.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi)];
const lastScript = scriptMatches[scriptMatches.length - 1][1];

const domElements = {};
function createMockElement(id) {
  return {
    id,
    value: 'all',
    textContent: '',
    innerText: '',
    innerHTML: '',
    style: {},
    classList: { contains: () => false, add: () => {}, remove: () => {} },
    children: [],
    querySelectorAll: () => [],
    querySelector: () => ({ textContent: '' }),
    scrollIntoView: () => {},
    setAttribute: function(k, v) { this[k] = v; },
    getAttribute: function(k) { return this[k]; }
  };
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

console.log('\n======================================================');
console.log('TEST 1: Partidas de Segunda-feira 02/11/2026 (Dia anterior)');
const m2 = context.window.getMatchesForDate('2026-11-02');
console.log(`Total partidas dia 02/11: ${m2.length}`);
const nonFinished2 = m2.filter(m => m.status !== 'finished');
console.log(`Partidas não finalizadas no dia 02/11: ${nonFinished2.length}`);
m2.forEach((m, i) => console.log(`  [${i+1}] [${m.start_time}-${m.end_time}] ${m.customer_name} | status: ${m.status}`));

if (nonFinished2.length === 0 && m2.length > 0) {
  console.log('✓ PASS: Todas as partidas do dia 02/11 estão 100% FINALIZADAS!');
} else {
  console.error('❌ FAIL: Partidas do dia 02/11 deveriam estar finalizadas');
}

console.log('\n======================================================');
console.log('TEST 2: Partidas de Terça-feira 03/11/2026 (Dia anterior)');
const m3 = context.window.getMatchesForDate('2026-11-03');
console.log(`Total partidas dia 03/11: ${m3.length}`);
const nonFinished3 = m3.filter(m => m.status !== 'finished');
console.log(`Partidas não finalizadas no dia 03/11: ${nonFinished3.length}`);
m3.forEach((m, i) => console.log(`  [${i+1}] [${m.start_time}-${m.end_time}] ${m.customer_name} | status: ${m.status}`));

if (nonFinished3.length === 0 && m3.length === 5) {
  console.log('✓ PASS: Todas as 5 partidas do dia 03/11 estão 100% FINALIZADAS!');
} else {
  console.error('❌ FAIL: Partidas do dia 03/11 deveriam estar finalizadas');
}

console.log('\n======================================================');
console.log('TEST 3: Partidas de Quarta-feira 04/11/2026 (Dia atual - NÃO finalizadas automaticamente)');
const m4 = context.window.getMatchesForDate('2026-11-04');
console.log(`Total partidas dia 04/11: ${m4.length}`);
const active4 = m4.filter(m => m.status !== 'finished');
console.log(`Partidas ativas (não finalizadas) no dia 04/11: ${active4.length}`);
m4.forEach((m, i) => console.log(`  [${i+1}] [${m.start_time}-${m.end_time}] ${m.customer_name} | status: ${m.status}`));

if (active4.length > 0) {
  console.log('✓ PASS: As partidas de hoje (04/11) continuam ativas para operação em tempo real!');
} else {
  console.error('❌ FAIL: As partidas de hoje não devem ser forçadas a finalizadas antes do jogo');
}

console.log('\n======================================================');
console.log('TEST 4: Timer e Botão para partida ativa de hoje (04/11)');
const timerSample = context.window.calcMatchTimer('15:00', '19:00', 0, 'confirmed', '2026-11-04');
console.log('Timer result for active match:', timerSample);
if (!JSON.stringify(timerSample).toLowerCase().includes('bola')) {
  console.log('✓ PASS: Nenhuma menção de "bola" no timer!');
} else {
  console.error('❌ FAIL: Menção de bola encontrada no timer');
}
