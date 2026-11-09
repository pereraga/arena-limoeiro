const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- Checking arena_jogos_excluidos_v1 in admin.html ---');
let p = 0;
while ((p = content.indexOf('arena_jogos_excluidos_v1', p)) !== -1) {
  console.log('occurrence at:', p);
  console.log(content.substring(Math.max(0, p - 80), Math.min(content.length, p + 150)));
  p += 'arena_jogos_excluidos_v1'.length;
}
