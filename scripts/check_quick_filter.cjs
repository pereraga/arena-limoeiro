const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const needle = 'window.setMovementQuickFilter =';
const idx = code.indexOf(needle);
console.log(code.substring(idx - 100, idx + 1200));
