const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find all places where tabsList is defined
const idx = html.indexOf('const tabsList =');
console.log('tabsList at', idx);
if (idx !== -1) {
  console.log(html.substring(idx - 50, idx + 400));
}
