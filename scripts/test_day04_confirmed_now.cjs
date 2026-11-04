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

console.log('=== TEST: JOGOS DO DIA 04/11/2026 (HOJE) ===');
const matches04 = context.window.getMatchesForDate('2026-11-04');
console.log(`Total de jogos dia 04: ${matches04.length}`);

let finishedCount = 0;
let confirmedCount = 0;

matches04.forEach((m, i) => {
  if (m.status === 'finished') finishedCount++;
  if (m.status === 'confirmed') confirmedCount++;
  const timer = context.window.calcMatchTimer(m.start_time, m.end_time, 0, m.status, '2026-11-04');
  console.log(`  [${i+1}] [${m.start_time}-${m.end_time}] ${m.customer_name} | ${m.court_name} | Status: ${m.status} | Timer: ${timer.counter} (${timer.label})`);
});

console.log(`\nConfirmados / Prontos para iniciar: ${confirmedCount}`);
console.log(`Finalizados: ${finishedCount}`);

if (finishedCount === 0 && confirmedCount === 5) {
  console.log('\n🎉 SUCESSO TOTAL: TODOS OS 5 JOGOS DO DIA 04 ESTÃO CONFIRMADOS E PRONTOS PARA INICIAR!');
} else {
  console.error('\n❌ ERRO: Esperava 5 jogos confirmados e 0 finalizados.');
}
