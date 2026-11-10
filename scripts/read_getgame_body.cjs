const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('=== window.getGame (Lines 6398 to 6440) ===');
console.log(lines.slice(6397, 6445).join('\n'));
