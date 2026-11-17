const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find pullData or Supabase query for bookings
const idx = html.indexOf('pullData');
console.log('pullData at', idx);
if (idx !== -1) {
  console.log(html.substring(idx - 50, idx + 2000));
}
