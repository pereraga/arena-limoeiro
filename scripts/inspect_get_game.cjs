const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- Checking getGame definition ---');
const idx = content.indexOf('window.getGame =');
console.log(content.substring(idx - 50, idx + 1000));
