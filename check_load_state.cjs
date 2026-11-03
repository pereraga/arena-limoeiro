const fs = require('fs');
const html = fs.readFileSync('public/admin.html', 'utf8');

const pos = html.indexOf('function loadAdminGameState');
console.log('loadAdminGameState pos:', pos);
if (pos !== -1) {
  console.log(html.slice(pos, pos + 1500));
}
