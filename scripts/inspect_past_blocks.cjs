const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

console.log('--- BLOCK 1 (around 285706) ---');
console.log(content.slice(285400, 286200));

console.log('\n--- BLOCK 2 (around 319099) ---');
console.log(content.slice(318600, 320500));
