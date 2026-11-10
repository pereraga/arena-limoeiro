const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('=== saveEditGame lines (11860 to 11930) ===');
console.log(lines.slice(11860, 11930).join('\n'));
