const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const idx = code.indexOf('id="directBookingModal"');
const formIdx = code.indexOf('<form', idx);
console.log(code.substring(formIdx, formIdx + 1500));
