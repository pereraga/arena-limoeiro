const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('=== renderBalcaoTimeSlots (Lines 10895 to 11075) ===');
console.log(lines.slice(10895, 11075).join('\n'));
