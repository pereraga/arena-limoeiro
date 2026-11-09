const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- Checking purgeExpiredCloudBookings ---');
const idx = content.indexOf('window.purgeExpiredCloudBookings =');
console.log(content.substring(idx, idx + 2000));
