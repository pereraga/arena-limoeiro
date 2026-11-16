const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('=== Lines 5855 to 5885 ===');
console.log(lines.slice(5855, 5885).join('\n'));
