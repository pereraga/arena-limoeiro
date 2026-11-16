const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const target = 'movementCourtFilter';
let idx = 0;
while ((idx = html.indexOf(target, idx)) !== -1) {
  console.log('Found target at:', idx);
  console.log(html.substring(Math.max(0, idx - 40), Math.min(html.length, idx + 200)).replace(/\n/g, ' '));
  idx += target.length;
}

const target2 = 'movementFilterCourt';
idx = 0;
while ((idx = html.indexOf(target2, idx)) !== -1) {
  console.log('Found movementFilterCourt at:', idx);
  console.log(html.substring(Math.max(0, idx - 40), Math.min(html.length, idx + 200)).replace(/\n/g, ' '));
  idx += target2.length;
}
