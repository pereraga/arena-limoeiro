const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('=== openEditGame and saveEditGame ===');
lines.forEach((l, i) => {
  if (l.includes('window.openEditGame =') || l.includes('window.saveEditGame =')) {
    console.log(`--- Starting at line ${i+1} ---`);
    console.log(lines.slice(i, i + 80).join('\n'));
  }
});
