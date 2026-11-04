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

['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06'].forEach(d => {
  const matches = context.window.getMatchesForDate(d);
  console.log(`\n=================== DATE: ${d} ===================`);
  console.log(`Matches count: ${matches.length}`);
  matches.forEach((m, idx) => {
    console.log(`  [${idx+1}] ${m.start_time} - ${m.end_time} | ${m.customer_name} | Court: ${m.court_name} | Status: ${m.status} | R$ ${m.total_price}`);
  });
});
