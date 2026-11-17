const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const idx = code.indexOf('window.handleSaveDirectBooking =');
if (idx !== -1) {
  console.log(code.substring(idx, idx + 2500));
} else {
  const idx2 = code.indexOf('function handleSaveDirectBooking');
  console.log(code.substring(idx2, idx2 + 2500));
}
