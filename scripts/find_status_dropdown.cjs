const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const target = 'STATUS:';
let idx = 0;
while ((idx = html.indexOf(target, idx)) !== -1) {
  console.log('Found STATUS: at:', idx);
  console.log(html.substring(Math.max(0, idx - 100), Math.min(html.length, idx + 400)).replace(/\n/g, ' '));
  idx += target.length;
}
