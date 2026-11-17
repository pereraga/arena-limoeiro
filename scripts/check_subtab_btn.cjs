const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const needle = 'subtabBadgeJogosCount';
const idx = code.indexOf(needle);
const btnIdx = code.lastIndexOf('<button', idx);
console.log(code.substring(btnIdx - 200, idx + 200));
