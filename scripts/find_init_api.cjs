const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const target = 'window.initApiPlayground';
const idx = content.indexOf(target);
console.log('Index of initApiPlayground:', idx);
if (idx !== -1) {
  console.log(content.substring(idx - 100, idx + 400));
}
