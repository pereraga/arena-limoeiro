const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('=== openContract and saveContract (Lines 11925 to 12050) ===');
console.log(lines.slice(11925, 12050).join('\n'));
