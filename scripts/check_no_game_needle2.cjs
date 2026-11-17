const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const needle = 'Todos os horários estão livres';
console.log('Todos os horários estão livres in admin.html:', code.includes(needle));

const needle2 = 'Nenhum jogo agendado';
let p = 0;
while ((p = code.indexOf(needle2, p)) !== -1) {
  console.log('pos:', p, code.substring(p - 50, p + 200));
  p += needle2.length;
}
