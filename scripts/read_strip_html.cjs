const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(1280, 1380).map((l, i) => `${i + 1281}: ${l}`).join('\n'));
