const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '..', 'public', 'default-data.js'), 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('Davi') || l.includes('9958-1034')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
