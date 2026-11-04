const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(1245, 1285).map((l, i) => `${i + 1246}: ${l}`).join('\n'));
