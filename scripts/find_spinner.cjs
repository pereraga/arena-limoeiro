const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const target = 'Sincronizando partidas em tempo real...';
let idx = 0;
while ((idx = html.indexOf(target, idx)) !== -1) {
  console.log('Found target at:', idx);
  console.log(html.substring(Math.max(0, idx - 150), Math.min(html.length, idx + 400)));
  idx += target.length;
}

const target2 = 'Sincronizando...';
idx = 0;
while ((idx = html.indexOf(target2, idx)) !== -1) {
  console.log('Found Sincronizando... at:', idx);
  console.log(html.substring(Math.max(0, idx - 100), Math.min(html.length, idx + 200)));
  idx += target2.length;
}
