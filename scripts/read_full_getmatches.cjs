const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin.html'), 'utf8');
const lines = content.split('\n');
console.log(lines.slice(4250, 4390).join('\n'));
