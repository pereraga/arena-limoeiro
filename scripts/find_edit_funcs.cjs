const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const regex = /(?:function|window\.)[a-zA-Z0-9_]*(?:Edit|Update|save)[a-zA-Z0-9_]*/gi;
const matches = new Set(content.match(regex) || []);
console.log('Matches:', Array.from(matches));

const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('Editar') && (l.includes('modal') || l.includes('Modal') || l.includes('onclick'))) {
    console.log(`Line ${i+1}: ${l.trim().slice(0, 150)}`);
  }
});
