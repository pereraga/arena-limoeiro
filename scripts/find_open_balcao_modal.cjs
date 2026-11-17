const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find openDirectBookingModal
const idx = html.indexOf('window.openDirectBookingModal = function');
console.log('openDirectBookingModal at', idx);
if (idx !== -1) {
  console.log(html.substring(idx, idx + 1500));
}
