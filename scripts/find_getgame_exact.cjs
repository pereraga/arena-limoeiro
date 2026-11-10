const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

lines.forEach((l, i) => {
  if (l.includes('getGame =') || l.includes('function getGame(') || l.includes('const getGame =') || l.includes('let getGame =')) {
    console.log(`Line ${i+1}: ${l}`);
  }
});
