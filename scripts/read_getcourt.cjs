const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('=== getCourtById (around line 5850 to 5920) ===');
console.log(lines.slice(5845, 5920).join('\n'));
