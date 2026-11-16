const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const target = 'COURT_STORAGE_KEY';
let idx = 0;
while ((idx = html.indexOf(target, idx)) !== -1) {
  console.log('Found COURT_STORAGE_KEY at:', idx);
  console.log(html.substring(idx - 100, idx + 200).replace(/\n/g, ' '));
  idx += target.length;
}
