const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

// Check purgeExpiredCloudBookings cutoffDate calculation
const idx = content.indexOf('window.purgeExpiredCloudBookings =');
console.log(content.substring(idx, idx + 800));
