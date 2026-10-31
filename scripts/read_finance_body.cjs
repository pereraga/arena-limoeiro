const fs = require('fs');

const content = fs.readFileSync('C:/Users/PC/Downloads/arena_limoeiro_painel_financeiro_inteligente.html', 'utf8');
const lines = content.split('\n');

console.log('--- LINES 20 to 120 ---');
console.log(lines.slice(20, 120).join('\n'));

console.log('--- LINES 120 to 250 ---');
console.log(lines.slice(120, 250).join('\n'));
