const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

for (let i = 9970; i < 10070; i++) {
  if (lines[i].includes('court') || lines[i].includes('space') || lines[i].includes('quadra') || lines[i].includes('campo')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
  }
}

console.log('=== Checking modalGerenciar fields ===');
lines.forEach((l, i) => {
  if (l.includes('modalGerenciar') && (l.includes('id=') || l.includes('select') || l.includes('input'))) {
    console.log(`Line ${i+1}: ${l.trim().slice(0, 120)}`);
  }
});
