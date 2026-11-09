const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- Checking pullDataFromCloudDatabases and bookings array replacement ---');
const idx = content.indexOf('window.adminGameState.bookings = cloudBookings;');
console.log(content.substring(idx - 200, idx + 400));
