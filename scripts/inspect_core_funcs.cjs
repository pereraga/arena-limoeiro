const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');
const lines = content.split('\n');

console.log('--- LINES 3935 TO 3980 ---');
console.log(lines.slice(3935, 3980).join('\n'));

console.log('--- LINES 4215 TO 4375 ---');
console.log(lines.slice(4215, 4375).join('\n'));
