const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin.html'), 'utf8');

const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('openFinishGame') || l.includes('concluir') || l.includes('finishGame') || l.includes('finishCurrentGame')) {
    console.log(`${idx + 1}: ${l.trim().slice(0, 100)}`);
  }
});
