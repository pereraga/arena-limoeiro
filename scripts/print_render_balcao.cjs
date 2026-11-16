const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const idx = 571604;
console.log('--- renderBalcaoTimeSlots implementation ---');
console.log(html.substring(idx, idx + 4500));
