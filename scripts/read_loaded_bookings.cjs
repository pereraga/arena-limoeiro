const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find getLoadedBookings and getLoadedMonthly
const idx = html.indexOf('function getLoadedBookings');
console.log(html.substring(idx - 50, idx + 1500));
