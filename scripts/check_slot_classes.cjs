const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const needle = 'rounded-';
// Search inside balcao slots
const idx = code.indexOf('id="directBookingSlotsGrid"');
console.log(code.substring(idx, idx + 1000));
