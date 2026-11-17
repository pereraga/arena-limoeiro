const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const needle = 'bg-rose-50';
let p = 0;
while ((p = code.indexOf(needle, p)) !== -1) {
  console.log('pos:', p, code.substring(p - 40, p + 160));
  p += needle.length;
}
