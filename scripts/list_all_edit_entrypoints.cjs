const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

lines.forEach((l, i) => {
  if (l.includes('saveEditGame') || l.includes('openEditGame') || l.includes('saveContract') || l.includes('openContract') || l.includes('handleSalvarClienteModal') || l.includes('salvarEdicaoReservaRapida')) {
    console.log(`Line ${i+1}: ${l.trim().slice(0, 120)}`);
  }
});
