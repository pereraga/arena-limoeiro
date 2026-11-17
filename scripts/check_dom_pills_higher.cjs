const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const idx = code.indexOf('id="movementMatchesListContainer"');
console.log(code.substring(idx - 6000, idx - 2000));
