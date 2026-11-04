const fs = require('fs');

const content = fs.readFileSync('public/admin.html', 'utf8');
const idx = content.indexOf('window.toggleDetails = function');
console.log('Index of toggleDetails:', idx);
if (idx !== -1) {
  console.log(content.slice(idx - 50, idx + 600));
}
