const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const idx = content.indexOf('arenaToast =');
console.log('arenaToast = at:', idx);
if (idx !== -1) {
  console.log(content.substring(idx - 50, idx + 800));
}
