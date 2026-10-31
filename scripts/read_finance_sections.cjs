const fs = require('fs');

const content = fs.readFileSync('C:/Users/PC/Downloads/arena_limoeiro_painel_financeiro_inteligente.html', 'utf8');
const lines = content.split('\n');

console.log('--- LINES 250 to 450 ---');
console.log(lines.slice(250, 450).join('\n'));

console.log('--- LINES 450 to 650 ---');
console.log(lines.slice(450, 650).join('\n'));
