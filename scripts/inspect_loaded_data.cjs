const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

function showAround(str, len = 1200) {
  const idx = content.indexOf(str);
  if (idx !== -1) {
    console.log(content.substring(idx, idx + len));
  }
}

console.log('--- getLoadedBookings ---');
showAround('function getLoadedBookings()');

console.log('--- getLoadedMonthly ---');
showAround('function getLoadedMonthly()');
