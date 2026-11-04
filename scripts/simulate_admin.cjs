const fs = require('fs');
const path = require('path');

const adminHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin.html'), 'utf8');
const defaultData = fs.readFileSync(path.join(__dirname, '..', 'public', 'default-data.js'), 'utf8');

const window = {
  location: { search: '', hash: '' },
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  },
  document: {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  }
};

const fnData = new Function('window', defaultData);
fnData(window);

const s10Match = adminHtml.match(/\(function\(\)\s*\{\s*'use strict';[\s\S]*?\}\)\(\);/);
let s10Code = s10Match[0];
s10Code = s10Code.replace('function getMatchesForDate(dateStr) {', 'window.getMatchesForDate = getMatchesForDate; function getMatchesForDate(dateStr) {');
s10Code = s10Code.replace(/^\(function\(\)\s*\{/, '(function(window, document, localStorage) {');
s10Code = s10Code.replace(/\}\)\(\);?$/, '})(window, window.document, window.localStorage);');

const fnScript = new Function('window', s10Code);
fnScript(window);

const matchesNov3 = window.getMatchesForDate('2026-11-03');
console.log('matchesNov3 length:', matchesNov3.length);
console.log('matchesNov3:', matchesNov3.map(m => ({ id: m.id, name: m.customer_name, time: m.time, date: m.date, obs: m.observation })));
