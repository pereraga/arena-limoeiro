const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('Partida de data anterior') || l.includes('Pendente de finaliza') || l.includes('Pendente de fechamento') || l.includes('data anterior')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
