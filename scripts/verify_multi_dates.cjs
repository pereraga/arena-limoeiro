const fs = require('fs');
const path = require('path');

const adminHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin.html'), 'utf8');
const defaultData = fs.readFileSync(path.join(__dirname, '..', 'public', 'default-data.js'), 'utf8');

const window = {
  location: { search: '', hash: '' },
  localStorage: { getItem: () => null, setItem: () => {} },
  document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] }
};

const fnData = new Function('window', defaultData);
fnData(window);

const s10Match = adminHtml.match(/\(function\(\)\s*\{\s*'use strict';[\s\S]*?\}\)\(\);/);
let s10Code = s10Match[0];
s10Code = s10Code.replace(/^\(function\(\)\s*\{/, '(function(window, document, localStorage) {');
s10Code = s10Code.replace(/\}\)\(\);?$/, '})(window, window.document, window.localStorage);');

const fnScript = new Function('window', s10Code);
fnScript(window);

['2026-11-02', '2026-11-03', '2026-11-04'].forEach(d => {
  const m = window.getMatchesForDate(d);
  console.log(`Date: ${d} -> ${m.length} matches:`, m.map(x => `${x.customer_name} (${x.time})`).join(', '));
});
