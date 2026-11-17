const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const needle = 'openNoShow(';
let p = 0;
while ((p = code.indexOf(needle, p)) !== -1) {
  console.log('pos:', p, code.substring(p - 50, p + 250));
  p += needle.length;
}
