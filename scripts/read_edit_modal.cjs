const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('=== Edit Match Modal (around line 4992) ===');
console.log(lines.slice(4990, 5080).join('\n'));
