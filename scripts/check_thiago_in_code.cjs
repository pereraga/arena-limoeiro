const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const needle = 'ARENA-B1950';
console.log('ARENA-B1950 in admin.html:', code.includes(needle));
const needle2 = 'Thiago';
let p = 0;
while ((p = code.indexOf(needle2, p)) !== -1) {
  console.log('pos:', p, code.substring(p - 30, p + 80));
  p += needle2.length;
}
