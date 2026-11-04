const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('9958-1034') || l.includes('99581034') || l.includes('Davi') || l.includes('036.115.324-44')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
