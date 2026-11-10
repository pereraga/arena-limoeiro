const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('=== Lines 9630 to 9700 ===');
console.log(lines.slice(9630, 9700).join('\n'));
