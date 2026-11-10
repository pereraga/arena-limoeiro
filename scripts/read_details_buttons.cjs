const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('=== Inside details-${m.id} (Lines 8820 to 8960) ===');
console.log(lines.slice(8820, 8960).join('\n'));
