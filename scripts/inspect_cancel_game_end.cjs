const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- cancelGame continuation around 631000 ---');
console.log(content.substring(631400, 633500));
