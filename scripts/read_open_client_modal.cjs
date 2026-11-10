const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

for (let i = 9850; i < 9950; i++) {
  if (lines[i].includes('modalGerenciar') || lines[i].includes('abrirModalGerenciarCliente') || lines[i].includes('openClientModal')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
  }
}
