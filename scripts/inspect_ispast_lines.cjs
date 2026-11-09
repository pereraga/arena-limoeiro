const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const sIdx = content.indexOf('function getMatchesForDate(dateStr) {');
const chunk = content.substring(sIdx + 3000, sIdx + 4500);
console.log(chunk);
