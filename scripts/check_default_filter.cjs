const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const needle = 'matches.filter(m => m.status !== \'finished\');';
const idx = code.indexOf(needle);
console.log('Default filter filter(m => m.status !== finished):', idx);
console.log(code.substring(idx - 200, idx + 200));
