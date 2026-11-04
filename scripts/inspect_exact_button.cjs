const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const idx = content.indexOf("isFutureDay ? 'Concluir Jogo'");
console.log(content.slice(idx - 350, idx + 150));
