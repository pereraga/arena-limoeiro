const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const target = 'Editar espaço';
let idx = 0;
while ((idx = html.indexOf(target, idx)) !== -1) {
  console.log('Found Editar espaço at:', idx);
  console.log(html.substring(idx - 100, idx + 100).replace(/\n/g, ' '));
  idx += target.length;
}

const target2 = 'arena_courts';
idx = 0;
while ((idx = html.indexOf(target2, idx)) !== -1) {
  console.log('Found arena_courts at:', idx);
  console.log(html.substring(idx - 30, idx + 100).replace(/\n/g, ' '));
  idx += target2.length;
}
