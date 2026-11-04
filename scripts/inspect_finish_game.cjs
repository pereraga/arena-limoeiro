const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin.html'), 'utf8');
const lines = content.split('\n');

console.log('--- LINE 4526 ---');
console.log(lines.slice(4520, 4560).join('\n'));

console.log('--- LINE 6934 ---');
console.log(lines.slice(6930, 6970).join('\n'));
