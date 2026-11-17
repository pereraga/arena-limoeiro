const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const pos = 637380;
const loopIdx = code.indexOf('for (let m = 6 * 60; m <= 23 * 60; m += 30) {', pos);
console.log(code.substring(loopIdx + 2000, loopIdx + 4500));
