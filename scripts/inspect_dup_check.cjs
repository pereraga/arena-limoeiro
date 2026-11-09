const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const sIdx = content.indexOf('function getMatchesForDate(dateStr) {');
const chunk = content.substring(sIdx, sIdx + 4000);

const dupCheckIdx = chunk.indexOf('const existing = matches.find');
console.log('--- existing check snippet ---');
console.log(chunk.substring(dupCheckIdx - 100, dupCheckIdx + 600));
