const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- renderMovementMatches container update (around 490000 - 493000) ---');
console.log(content.substring(490000, 493000));
