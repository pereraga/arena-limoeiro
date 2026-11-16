const fs = require('fs');

const path = 'public/admin.html';
const content = fs.readFileSync(path, 'utf-8');

// Verifique o que está acontecendo com os mensalistas e o getMatchesForDate
// Vamos verificar o bloco dos mensalistas em getMatchesForDate
const lines = content.split('\n');
console.log('Total lines in admin.html:', lines.length);

const idxMatches = lines.findIndex(l => l.includes('function getMatchesForDate(dateStr)'));
console.log('getMatchesForDate is at line:', idxMatches + 1);

console.log(lines.slice(idxMatches, idxMatches + 90).join('\n'));
