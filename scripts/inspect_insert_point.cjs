const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const target = 'window.handleGameMainAction =';
const idx = content.indexOf(target);
console.log('Index of handleGameMainAction:', idx);
if (idx !== -1) {
  console.log(content.substring(idx - 200, idx + 400));
}
