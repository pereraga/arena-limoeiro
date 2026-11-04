const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const serverPath = path.join(root, 'server.js');
const content = fs.readFileSync(serverPath, 'utf8');

const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('app.get') || l.includes('app.post') || l.includes('app.use') || l.includes('middleware')) {
    console.log(`${idx + 1}: ${l.trim().slice(0, 100)}`);
  }
});
