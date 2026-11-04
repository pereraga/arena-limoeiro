const fs = require('fs');

const content = fs.readFileSync('public/admin.html', 'utf8');
const idx = content.indexOf('window.selectMovementDay = function');
console.log('Index:', idx);
if (idx !== -1) {
  console.log(content.slice(idx, idx + 1200));
}
