const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const idx = 605901;
console.log('--- openDirectBookingModal code ---');
console.log(html.substring(idx, idx + 2500));
