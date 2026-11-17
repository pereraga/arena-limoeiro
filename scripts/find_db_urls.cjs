const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find db2Url or db1Url
const idx = html.indexOf('db2Url');
console.log('db2Url at', idx);
if (idx !== -1) {
  console.log(html.substring(idx - 100, idx + 400));
}
