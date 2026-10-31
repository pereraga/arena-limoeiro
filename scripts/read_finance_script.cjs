const fs = require('fs');

const content = fs.readFileSync('C:/Users/PC/Downloads/arena_limoeiro_painel_financeiro_inteligente.html', 'utf8');
const lines = content.split('\n');

console.log('--- LINES 650 to 950 ---');
console.log(lines.slice(650, 950).join('\n'));
