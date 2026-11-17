const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const needle = 'Painel Administrativo';
let p = 0;
while ((p = code.indexOf(needle, p)) !== -1) {
  console.log('pos:', p, code.substring(p - 60, p + 120));
  p += needle.length;
}
