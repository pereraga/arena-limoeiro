const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(4135, 4350).map((l, i) => `${i + 4136}: ${l}`).join('\n'));
