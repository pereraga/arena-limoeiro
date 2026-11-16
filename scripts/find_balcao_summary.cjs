const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const target = 'updateBalcaoSelectionSummary';
let idx = 0;
while ((idx = html.indexOf(target, idx)) !== -1) {
  console.log('Found updateBalcaoSelectionSummary at:', idx);
  console.log(html.substring(idx - 50, idx + 250).replace(/\n/g, ' '));
  idx += target.length;
}

const target2 = 'Horário: ';
idx = 0;
while ((idx = html.indexOf(target2, idx)) !== -1) {
  console.log('Found "Horário: " at:', idx);
  console.log(html.substring(idx - 50, idx + 200).replace(/\n/g, ' '));
  idx += target2.length;
}
