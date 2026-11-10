const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('=== renderMatchCardHtml around details and actions (Lines 8700 to 8850) ===');
for (let i = 8400; i < 8900; i++) {
  if (lines[i] && (lines[i].includes('openEditGame') || lines[i].includes('Detalhes e ações') || lines[i].includes('openContract') || lines[i].includes('Editar Jogo'))) {
    console.log(`Line ${i+1}: ${lines[i].trim().slice(0, 150)}`);
  }
}
