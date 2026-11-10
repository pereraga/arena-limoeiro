const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('=== Lines 10125 to 10165 ===');
console.log(lines.slice(10125, 10165).join('\n'));
