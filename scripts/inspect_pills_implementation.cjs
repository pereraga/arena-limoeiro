const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const target = 'selectMovementCourtPill';
let idx = 0;
while ((idx = html.indexOf(target, idx)) !== -1) {
  console.log('Found target at:', idx);
  console.log(html.substring(Math.max(0, idx - 40), Math.min(html.length, idx + 250)).replace(/\n/g, ' '));
  idx += target.length;
}
