const fs = require('fs');

const content = fs.readFileSync('public/admin.html', 'utf8');
const idx = content.indexOf('booking-detail-toggle');
console.log('Index of booking-detail-toggle in renderMovementMatches:', idx);
if (idx !== -1) {
  console.log(content.slice(idx - 100, idx + 600));
}
