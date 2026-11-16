const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const targets = ['[CPF:', '[Emergência:', 'Jogo 4/24', '{Jogo', 'Mensalista}'];
targets.forEach(t => {
  let idx = 0;
  let count = 0;
  while ((idx = html.indexOf(t, idx)) !== -1) {
    count++;
    console.log(`Found "${t}" at index ${idx}:`);
    console.log(html.substring(Math.max(0, idx - 100), Math.min(html.length, idx + 250)).replace(/\n/g, ' '));
    idx += t.length;
  }
  console.log(`Total for "${t}": ${count}`);
});
