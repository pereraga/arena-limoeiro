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
    getElementById: (id) => {
      return {
        value: '',
        textContent: '',
        innerText: '',
        innerHTML: '',
        style: {},
        classList: { contains: () => false, add: () => {}, remove: () => {} },
        querySelectorAll: () => [],
        querySelector: () => null,
        addEventListener: () => {}
      };
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
  setTimeout: () => {}
};
context.window.document = context.document;
context.window.localStorage = context.localStorage;
context.window.console = context.console;

const defaultData = fs.readFileSync('public/default-data.js', 'utf8');
vm.createContext(context);
vm.runInContext(defaultData, context);

try {
  vm.runInContext(lastScript, context);
  console.log('✓ Admin script executed smoothly without errors!');

  const matches = context.window.getMatchesForDate('2026-11-03');
  console.log(`\n========================================`);
  console.log(`MATCHES FOR 2026-11-03: count = ${matches.length}`);
  let total = 0;
  matches.forEach((m, i) => {
    total += m.total_price;
    console.log(`  #${i+1}: [${m.start_time} - ${m.end_time}] ${m.customer_name} | ${m.court_name} | R$ ${m.total_price}`);
  });
  console.log(`Total Projected Revenue: R$ ${total.toFixed(2)}`);
  console.log(`========================================\n`);

  if (matches.length === 5) {
    console.log('🎉 100% SUCCESS: EXACTLY 5 GAMES IDENTIFIED AND COUNTED FOR 03/11/2026!');
  } else {
    console.error(`❌ ERROR: Expected 5 games, got ${matches.length}`);
  }
} catch(e) {
  console.error('Error running admin script:', e);
}
