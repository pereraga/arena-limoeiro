const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- Checking polling interval around 638000 ---');
const idx = content.indexOf('// Loop ativo e resiliente de sincronização');
console.log(content.substring(idx, idx + 1500));
