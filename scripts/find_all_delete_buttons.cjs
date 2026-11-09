const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

// Find all buttons that trigger cancellation or deletion
const matches = [];
const regex = /(?:onclick=["']([^"']*(?:delete|cancelar|excluir)[^"']*)["'])/gi;
let m;
while ((m = regex.exec(content)) !== null) {
  matches.push({ pos: m.index, snippet: m[0] });
}

console.log('Matches with delete/cancelar/excluir:');
matches.forEach(item => console.log(item.snippet));
