const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- cancelGame function continuation around 631000 ---');
const idx = content.indexOf('const cancelGame = window.cancelGame');
console.log(content.substring(idx + 2200, idx + 4200));
