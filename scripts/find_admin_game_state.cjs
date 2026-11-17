const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find adminGameState definition
const idx = html.indexOf('adminGameState =');
console.log('adminGameState = at', idx);
if (idx !== -1) {
  console.log(html.substring(idx - 100, idx + 1000));
}
