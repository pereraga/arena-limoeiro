const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('=== syncBookingToCloud (around line 6042) ===');
console.log(lines.slice(6040, 6130).join('\n'));
