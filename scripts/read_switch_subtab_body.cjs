const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(6450, 6550).map((l, i) => `${i + 6451}: ${l}`).join('\n'));
