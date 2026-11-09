const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- renderMovementMatches (485300 - 490000) ---');
console.log(content.substring(485300, 490000));
