const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('=== window.getGame (Lines 6440 to 6480) ===');
console.log(lines.slice(6440, 6480).join('\n'));
