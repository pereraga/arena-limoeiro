const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- Checking pullDataFromCloudDatabases and syncBookingToCloud continuation ---');
const idx = content.indexOf('window.syncBookingToCloud =');
console.log(content.substring(idx + 900, idx + 2600));
