const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- Checking deleteMatchPrompt & monthly deletion ---');
const idx = content.indexOf('window.deleteMatchPrompt =');
console.log(content.substring(idx, idx + 1500));
