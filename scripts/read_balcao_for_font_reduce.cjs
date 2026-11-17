const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find directBookingModal
const idx = html.indexOf('<div id="directBookingModal"');
console.log('directBookingModal at', idx);
if (idx !== -1) {
  console.log(html.substring(idx, idx + 1500));
}
