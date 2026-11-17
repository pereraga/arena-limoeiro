const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const regex = /getGame\s*=\s*function|function\s+getGame\s*\(/g;
let m;
while ((m = regex.exec(code)) !== null) {
  console.log('pos:', m.index, code.substring(m.index, m.index + 500));
}
