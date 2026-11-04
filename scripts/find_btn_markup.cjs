const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const idx = content.indexOf("isFutureDay ? 'Concluir Jogo'");
console.log('Index:', idx);
if (idx !== -1) {
  console.log(content.slice(idx - 100, idx + 200));
}
