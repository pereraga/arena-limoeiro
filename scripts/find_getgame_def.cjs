const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

lines.forEach((l, i) => {
  if (l.includes('function getGame(') || l.includes('function getGame =')) {
    console.log(`--- getGame at line ${i+1} ---`);
    console.log(lines.slice(i, i + 35).join('\n'));
  }
});
