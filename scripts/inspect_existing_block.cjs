const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const sIdx = content.indexOf('function getMatchesForDate(dateStr) {');
const chunk = content.substring(sIdx, sIdx + 4500);

const findExisting = chunk.indexOf('const existing = matches.find');
console.log(chunk.substring(findExisting, findExisting + 800));
