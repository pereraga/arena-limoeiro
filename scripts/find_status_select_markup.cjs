const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const targets = ['Partidas Ativas (Ocultar Finaliza', 'Ocultar Finaliza', 'filterStatus', 'statusFilter', 'selectedCourt'];
targets.forEach(t => {
  let idx = 0;
  while ((idx = html.indexOf(t, idx)) !== -1) {
    console.log(`Found "${t}" at ${idx}:`);
    console.log(html.substring(Math.max(0, idx - 100), Math.min(html.length, idx + 250)).replace(/\n/g, ' '));
    idx += t.length;
  }
});
