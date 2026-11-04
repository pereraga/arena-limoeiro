const fs = require('fs');

const adminHtml = fs.readFileSync('public/admin.html', 'utf8');

// Find all script tags in adminHtml
const scriptMatches = [...adminHtml.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi)];
console.log(`Found ${scriptMatches.length} script tags`);

const lastScript = scriptMatches[scriptMatches.length - 1][1];
console.log('Last script length:', lastScript.length);

const vm = require('vm');
const context = {
  window: {},
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
context.window = context;

// Run default-data.js first
const defaultData = fs.readFileSync('public/default-data.js', 'utf8');
vm.createContext(context);
vm.runInContext(defaultData, context);

// Run the admin script
try {
  vm.runInContext(lastScript, context);
  console.log('Admin script executed without syntax errors!');

  const matches = context.window.getMatchesForDate('2026-11-03');
  console.log(`\nMatches for 2026-11-03: count = ${matches.length}`);
  let total = 0;
  matches.forEach((m, i) => {
    total += m.total_price;
    console.log(`  Match ${i+1}: [${m.start_time} - ${m.end_time}] ${m.customer_name} | ${m.court_name} | R$ ${m.total_price}`);
  });
  console.log(`Total Projected Revenue: R$ ${total.toFixed(2)}`);

  if (matches.length === 5) {
    console.log('\n✅ VERIFIED: Exactly 5 games for 03/11/2026!');
  } else {
    console.error(`\n❌ ERROR: Expected 5 games, got ${matches.length}`);
  }
} catch(e) {
  console.error('Error running admin script:', e);
}
