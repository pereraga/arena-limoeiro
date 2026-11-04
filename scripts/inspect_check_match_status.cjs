const fs = require('fs');

const content = fs.readFileSync('public/admin.html', 'utf8');

const idx = content.indexOf('window.checkMatchStatus = function');
console.log('Index of checkMatchStatus:', idx);
if (idx !== -1) {
  console.log(content.slice(idx, idx + 1500));
}
