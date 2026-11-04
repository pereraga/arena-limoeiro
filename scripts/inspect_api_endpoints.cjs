const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git') searchDir(full);
    } else if (f.endsWith('.js') || f.endsWith('.json') || f.endsWith('.cjs')) {
      const c = fs.readFileSync(full, 'utf8');
      const lines = c.split('\n');
      lines.forEach((l, idx) => {
        if (l.includes('/api/') || l.includes('app.get(') || l.includes('app.post(') || l.includes('router.')) {
          console.log(`${f}:${idx+1} -> ${l.trim().substring(0, 100)}`);
        }
      });
    }
  }
}

searchDir(path.join(__dirname, '..'));
