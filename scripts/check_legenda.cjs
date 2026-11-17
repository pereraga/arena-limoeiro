const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const needle = 'bg-rose-50 px-1.5 py-0.5 rounded-lg border border-rose-300';
let p = 0;
while ((p = code.indexOf(needle, p)) !== -1) {
  console.log('pos:', p, code.substring(p - 50, p + 200));
  p += needle.length;
}
