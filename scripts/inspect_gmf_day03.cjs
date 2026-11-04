const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(4315, 4420).map((l, i) => `${i + 4316}: ${l}`).join('\n'));
