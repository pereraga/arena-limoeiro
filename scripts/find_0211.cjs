const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin.html'), 'utf8');

const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('02/11') || l.includes('02-11')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
