const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('=== Lines 10025 to 10065 in handleSalvarClienteModal ===');
console.log(lines.slice(10024, 10065).join('\n'));
