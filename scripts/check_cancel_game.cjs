const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const needle = 'window.cancelGame =';
const idx = code.indexOf(needle);
console.log(code.substring(idx, idx + 2500));
