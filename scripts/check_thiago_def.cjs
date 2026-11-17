const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/default-data.js';
const code = fs.readFileSync(path, 'utf8');

const needle = 'Thiago';
let p = 0;
while ((p = code.indexOf(needle, p)) !== -1) {
  console.log('pos:', p, code.substring(p - 30, p + 80));
  p += needle.length;
}
