const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const target = 'setupArenaRealtime';
let idx = 0;
while ((idx = html.indexOf(target, idx)) !== -1) {
  console.log('Found setupArenaRealtime at:', idx);
  console.log(html.substring(idx - 40, idx + 250).replace(/\n/g, ' '));
  idx += target.length;
}

const target2 = 'realtime';
idx = 0;
while ((idx = html.toLowerCase().indexOf(target2, idx)) !== -1) {
  console.log('Found realtime at:', idx);
  console.log(html.substring(idx - 40, idx + 200).replace(/\n/g, ' '));
  idx += target2.length;
}
