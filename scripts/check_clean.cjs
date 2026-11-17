const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const idx = code.indexOf('cleanBookings =');
if (idx !== -1) {
  console.log(code.substring(idx - 100, idx + 1200));
} else {
  const idx2 = code.indexOf('window.adminGameState.bookings =');
  console.log(code.substring(idx2 - 100, idx2 + 1200));
}
