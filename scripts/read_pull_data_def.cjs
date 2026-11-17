const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

const idx = html.indexOf('window.pullDataFromCloudDatabases');
console.log('window.pullDataFromCloudDatabases at', idx);
if (idx !== -1) {
  console.log(html.substring(idx - 50, idx + 2500));
}
