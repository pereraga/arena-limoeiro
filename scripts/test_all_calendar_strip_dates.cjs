const fs = require('fs');

const adminHtml = fs.readFileSync('public/admin.html', 'utf8');

const scriptMatches = [...adminHtml.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi)];
const lastScript = scriptMatches[scriptMatches.length - 1][1];

const vm = require('vm');
const context = {
  window: {
    location: { search: '', hash: '', href: 'https://arenalimoeiro.vercel.app/admin' }
  },
  location: { search: '', hash: '', href: 'https://arenalimoeiro.vercel.app/admin' },
  document: {
    getElementById: () => ({
      value: '', textContent: '', innerText: '', innerHTML: '', style: {},
      classList: { contains: () => false, add: () => {}, remove: () => {} },
      querySelectorAll: () => [], querySelector: () => null, addEventListener: () => {}
    }),
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
  setTimeout: () => {}
};
context.window.document = context.document;
context.window.localStorage = context.localStorage;
context.window.console = context.console;

const defaultData = fs.readFileSync('public/default-data.js', 'utf8');
vm.createContext(context);
vm.runInContext(defaultData, context);
vm.runInContext(lastScript, context);

const datesList = [
  '2026-10-29', '2026-10-30', '2026-10-31',
  '2026-11-01', '2026-11-02', '2026-11-03',
  '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07',
  '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11',
  '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15',
  '2026-11-16', '2026-11-17', '2026-11-18'
];

console.log('--- CALENDAR 21-DAY STRIP MATCHES COUNT ---');
datesList.forEach(d => {
  const matches = context.window.getMatchesForDate(d);
  console.log(`${d}: ${matches.length === 0 ? 'Sem jogos' : matches.length + ' jogos'}`);
});
