const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- getLoadedBookings & getLoadedMonthly ---');
const idx = content.indexOf('function getLoadedBookings');
console.log(content.substring(idx - 50, idx + 1800));
