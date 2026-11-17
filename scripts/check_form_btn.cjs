const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const idx = code.indexOf('handleSaveDirectBooking =');
const formIdx = code.lastIndexOf('<form', idx);
console.log(code.substring(formIdx, formIdx + 500));
