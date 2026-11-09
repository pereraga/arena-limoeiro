const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const sIdx = content.indexOf('function getMatchesForDate(dateStr) {');
console.log(content.substring(sIdx + 2400, sIdx + 4800));
