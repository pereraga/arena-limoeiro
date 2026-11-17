const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const idx = code.indexOf('handleSaveDirectBooking =');
console.log(code.substring(idx + 2300, idx + 3500));
