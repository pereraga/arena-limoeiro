const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Check structure of a booking
const sampleBookings = (html.match(/\{[^}]*id:\s*['"]booking-[^}]*\}/gi) || []).slice(0, 3);
console.log('Sample bookings:');
sampleBookings.forEach(s => console.log(s));

// Check DB mapping
const dbMapIdx = html.indexOf('COURT_TO_DB_ID');
if (dbMapIdx !== -1) {
  console.log(html.substring(dbMapIdx, dbMapIdx + 400));
}
