const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin.html'), 'utf8');
const lines = content.split('\n');
console.log(lines.slice(3935, 3975).join('\n'));
