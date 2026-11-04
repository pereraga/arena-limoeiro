const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

// Let's check lines 4215 to 4375
const lines = content.split('\n');
console.log(lines.slice(4215, 4295).join('\n'));
