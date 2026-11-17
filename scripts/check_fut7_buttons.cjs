const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const needle = 'FUT 7 - SOCCER 7 (R$ 110/h)';
console.log('Search FUT 7 in admin.html:');
let p = 0;
while ((p = code.indexOf('FUT 7', p)) !== -1) {
  console.log('pos:', p, code.substring(p - 40, p + 100));
  p += 5;
}
