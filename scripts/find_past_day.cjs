const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin.html'), 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('isPastDay') || l.includes('Partida de data anterior') || l.includes('data anterior')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
