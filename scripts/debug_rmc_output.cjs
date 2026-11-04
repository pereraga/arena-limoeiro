const fs = require('fs');
const vm = require('vm');

const adminHtml = fs.readFileSync('public/admin.html', 'utf8');
const scriptMatches = [...adminHtml.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi)];
const lastScript = scriptMatches[scriptMatches.length - 1][1];

const context = {
  window: { location: { search: '', hash: '', href: '' } },
  document: { getElementById: () => null, querySelectorAll: () => [], querySelector: () => null, readyState: 'complete' },
  console: console,
  localStorage: { getItem: () => null, setItem: () => null },
  fetch: () => Promise.resolve({ ok: false }),
  performance: { now: () => Date.now() },
  setInterval: () => {},
  setTimeout: () => {}
};
context.window.document = context.document;
const defaultData = fs.readFileSync('public/default-data.js', 'utf8');
vm.createContext(context);
vm.runInContext(defaultData, context);
vm.runInContext(lastScript, context);

const matches = context.window.getMatchesForDate('2026-11-04');
console.log('Matches count:', matches.length);
console.log('Match 0 ID:', matches[0].id);

context.window.__openDetailsIds = new Set([String(matches[0].id)]);
const html = context.window.renderMatchCardHtml(matches[0], false);
const idx = html.indexOf('booking-expanded-panel');
console.log('Snippet around booking-expanded-panel:\n', html.slice(idx - 150, idx + 250));
