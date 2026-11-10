const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('=== ADMIN_COURTS (Lines 5755 to 5770) ===');
console.log(lines.slice(5755, 5770).join('\n'));
