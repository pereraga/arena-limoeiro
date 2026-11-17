const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const idx = code.indexOf('renderMovementMatches()');
const idxCard = code.indexOf('matches.forEach(m =>', idx);
console.log(code.substring(idxCard, idxCard + 1500));
