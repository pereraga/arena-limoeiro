const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const needle = 'ARENA-B1950';
console.log('ARENA-B1950 in code?', code.includes(needle));

// Check getGame definition
const gIdx = code.indexOf('function getGame(');
console.log(code.substring(gIdx, gIdx + 1200));
