const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const phrase = 'id="arenaToast"';
const idx = content.indexOf(phrase);
console.log('arenaToast element at:', idx);
if (idx !== -1) {
  console.log(content.substring(idx - 100, idx + 600));
}
