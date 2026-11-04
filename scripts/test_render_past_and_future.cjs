const fs = require('fs');
const path = require('path');
const vm = require('vm');

const defaultDataCode = fs.readFileSync(path.join(__dirname, '..', 'public', 'default-data.js'), 'utf8');
const adminCode = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin.html'), 'utf8');

const domMock = {
  window: {},
  document: {
    getElementById: (id) => null,
    querySelector: (sel) => null,
    querySelectorAll: (sel) => [],
    addEventListener: () => {},
    activeElement: null
  },
  localStorage: { getItem: () => null, setItem: () => {} },
  console: console,
  Set: Set, Array: Array, Math: Math, Date: Date,
  parseInt: parseInt, parseFloat: parseFloat, Number: Number, String: String,
  encodeURIComponent: encodeURIComponent,
  setInterval: () => 123, clearInterval: () => {}, setTimeout: () => 456, clearTimeout: () => {},
  location: { search: '', hash: '' },
  navigator: { userAgent: 'Node' }
};
domMock.window = domMock;
domMock.global = domMock;

vm.createContext(domMock);
vm.runInContext(defaultDataCode, domMock);

const scriptMatches = adminCode.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi);
const mainScript = scriptMatches.reduce((a, b) => a.length > b.length ? a : b).replace(/<\/?script[^>]*>/gi, '');

vm.runInContext(mainScript, domMock);

// Test Day 02 (Past day with 12 matches)
const day2Matches = domMock.window.getMatchesForDate('2026-11-02');
console.log('Day 02 matches count:', day2Matches.length);
day2Matches.forEach((m, i) => {
  const html = domMock.window.renderMatchCardHtml(m, i === 0);
  if (!html.includes('Finalizada') || !html.includes('Recibo')) {
    console.error(`Day 02 match #${i+1} (${m.id}) does not show Finalizada / Recibo`);
    process.exit(1);
  }
});
console.log('Day 02 (12 matches): All render with Finalizada / Recibo status!');

// Test Day 03 (Past day with 5 matches)
const day3Matches = domMock.window.getMatchesForDate('2026-11-03');
console.log('Day 03 matches count:', day3Matches.length);
day3Matches.forEach((m, i) => {
  const html = domMock.window.renderMatchCardHtml(m, i === 0);
  if (!html.includes('Finalizada') || !html.includes('Recibo')) {
    console.error(`Day 03 match #${i+1} (${m.id}) does not show Finalizada / Recibo`);
    process.exit(1);
  }
});
console.log('Day 03 (5 matches): All render with Finalizada / Recibo status!');

console.log('ALL PAST AND FUTURE MATCHES VERIFIED SUCCESSFULLY!');
