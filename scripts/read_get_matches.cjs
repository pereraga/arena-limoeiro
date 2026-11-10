const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('=== getMatchesForDate definition (Lines 6238-6370) ===');
console.log(lines.slice(6237, 6340).join('\n'));
