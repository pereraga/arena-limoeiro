const fs = require('fs');

const content = fs.readFileSync('public/admin.html', 'utf8');

const idxStart = content.indexOf('// =========================================================================\n  // ATUALIZAÇÃO DINÂMICA DA RÉGUA DE CALENDÁRIO COM CONTAGEM REAL DE JOGOS');
const idxEnd = content.indexOf('window.setMovementQuickFilter = function');

console.log('idxStart:', idxStart, 'idxEnd:', idxEnd);
if (idxStart !== -1 && idxEnd !== -1) {
  console.log(content.substring(idxStart, idxStart + 600));
}
