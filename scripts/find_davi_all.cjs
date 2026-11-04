const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f === 'node_modules' || f === '.git') continue;
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      searchDir(full);
    } else if (f.endsWith('.js') || f.endsWith('.json') || f.endsWith('.html') || f.endsWith('.ts')) {
      const txt = fs.readFileSync(full, 'utf8');
      if (txt.includes('Davi') || txt.includes('9958-1034') || txt.includes('99581034')) {
        console.log('Found in:', full);
      }
    }
  }
}

searchDir(path.join(__dirname, '..'));
