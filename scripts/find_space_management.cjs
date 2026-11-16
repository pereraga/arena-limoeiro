const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const target = 'Gestão de Espaços';
let idx = 0;
while ((idx = html.indexOf(target, idx)) !== -1) {
  console.log('Found target at:', idx);
  console.log(html.substring(idx - 30, idx + 150).replace(/\n/g, ' '));
  idx += target.length;
}

const targetSave = 'salvarEspaco';
idx = 0;
while ((idx = html.indexOf(targetSave, idx)) !== -1) {
  console.log('Found salvarEspaco at:', idx);
  console.log(html.substring(idx - 30, idx + 150).replace(/\n/g, ' '));
  idx += targetSave.length;
}
