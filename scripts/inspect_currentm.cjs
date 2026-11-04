const fs = require('fs');

const content = fs.readFileSync('public/admin.html', 'utf8');
const idx = content.indexOf('const currentM = now.getHours() * 60 + now.getMinutes();');
console.log('Index:', idx);
if (idx !== -1) {
  console.log(content.slice(idx, idx + 800));
}
