const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

// Search for syncBookingToCloud definition
const sIdx = content.indexOf('window.syncBookingToCloud =');
console.log('window.syncBookingToCloud at:', sIdx);
if (sIdx !== -1) {
  console.log(content.substring(sIdx, sIdx + 1500));
}
