const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- Checking checkAndAutoStartMatches ---');
const idx = content.indexOf('window.checkAndAutoStartMatches =');
console.log(content.substring(idx, idx + 2500));
