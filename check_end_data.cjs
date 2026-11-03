const fs = require('fs');

const d = fs.readFileSync('public/default-data.js', 'utf8');
const lines = d.split('\n');
console.log('Total lines:', lines.length);
console.log(lines.slice(lines.length - 40).join('\n'));
