const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- cancelGame function in admin.html ---');
const idx = content.indexOf('const cancelGame = window.cancelGame');
console.log(content.substring(idx, idx + 2500));
