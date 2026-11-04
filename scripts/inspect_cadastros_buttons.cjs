const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const target = 'Backup Completo JSON';
const idx = content.indexOf(target);
console.log('Index of Backup Completo JSON:', idx);

if (idx !== -1) {
  console.log(content.substring(Math.max(0, idx - 1500), Math.min(content.length, idx + 1500)));
}
