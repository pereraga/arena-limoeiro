const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const apiFiles = ['index.js', 'sync.js', 'keep-alive.js'];

apiFiles.forEach(f => {
  const p = path.join(root, 'api', f);
  if (fs.existsSync(p)) {
    console.log(`--- api/${f} ---`);
    console.log(fs.readFileSync(p, 'utf8').slice(0, 350));
  }
});
