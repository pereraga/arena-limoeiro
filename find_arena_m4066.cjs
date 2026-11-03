const fs = require('fs');

const d = fs.readFileSync('public/default-data.js', 'utf8');
const pos = d.indexOf('"ARENA-M4066"');
console.log(d.slice(pos - 100, pos + 800));
