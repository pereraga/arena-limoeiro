const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

console.log('Line of line 1320 (strip HTML):');
const stripIdx = content.indexOf('<!-- DIA ATUAL: TER 03 (HOJE) -->');
console.log('stripIdx:', stripIdx);
if (stripIdx !== -1) {
  console.log(content.substring(stripIdx, stripIdx + 500));
}

console.log('\nLine of fallback in getMatchesForDate:');
const fbIdx = content.indexOf('// Fallback garantido para terça-feira 03/11/2026');
console.log('fbIdx:', fbIdx);
if (fbIdx !== -1) {
  console.log(content.substring(fbIdx, fbIdx + 600));
}
