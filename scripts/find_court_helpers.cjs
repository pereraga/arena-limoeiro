const fs = require('fs');
const html = fs.readFileSync('public/admin.html', 'utf8');

const lines = html.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('ADMIN_COURTS') || l.includes('getCourtById') || l.includes('setDirectBookingDuration')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
