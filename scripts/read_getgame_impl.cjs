const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('=== Lines 6480 to 6530 ===');
console.log(lines.slice(6480, 6530).join('\n'));
