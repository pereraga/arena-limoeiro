const fs = require('fs');
const path = require('path');

function search(dir) {
  for (const f of fs.readdirSync(dir)) {
    if (f === 'node_modules' || f === '.git' || f === 'scripts') continue;
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) search(full);
    else if (f.endsWith('.js') || f.endsWith('.html')) {
      const c = fs.readFileSync(full, 'utf8');
      if (c.includes('2026-11-02')) {
        console.log('Found 2026-11-02 in:', full);
      }
    }
  }
}
search(path.join(__dirname, '..'));
