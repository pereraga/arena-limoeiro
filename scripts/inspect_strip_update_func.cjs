const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const idx = content.indexOf('window.updateMovementCalendarStrip = function()');
console.log(content.substring(idx, idx + 1200));
