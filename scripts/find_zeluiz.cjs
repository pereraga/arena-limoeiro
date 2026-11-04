const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'public', 'default-data.js'), 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.toLowerCase().includes('luiz') || l.toLowerCase().includes('ze luiz') || l.toLowerCase().includes('zé luiz')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
