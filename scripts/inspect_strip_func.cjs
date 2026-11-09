const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- Checking renderMovementCalendarStrip around 475533 ---');
console.log(content.substring(475500, 478000));
