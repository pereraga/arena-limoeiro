const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- HTML around 475449 ---');
console.log(content.substring(475000, 476000));

console.log('\n--- cancelGame definition around 628977 ---');
console.log(content.substring(628900, 631500));
