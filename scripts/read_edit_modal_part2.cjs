const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('=== Edit Match Modal (around line 5080 to 5227) ===');
console.log(lines.slice(5080, 5230).join('\n'));
