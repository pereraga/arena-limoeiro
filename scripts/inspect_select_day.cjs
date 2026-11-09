const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- window.selectMovementDay ---');
const idx = content.indexOf('window.selectMovementDay =');
if (idx !== -1) {
  console.log(content.substring(idx, idx + 1500));
}
