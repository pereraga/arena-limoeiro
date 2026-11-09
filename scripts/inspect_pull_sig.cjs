const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- Checking pullDataFromCloudDatabases signatures ---');
const idx = content.indexOf('const newSig = cloudBookings.length');
console.log(content.substring(idx - 100, idx + 1000));
