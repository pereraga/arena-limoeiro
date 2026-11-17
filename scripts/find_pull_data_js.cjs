const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find pullDataFromCloudDatabases JS definition
const idx = html.indexOf('pullDataFromCloudDatabases =');
console.log('pullDataFromCloudDatabases = at', idx);
if (idx !== -1) {
  console.log(html.substring(idx - 50, idx + 2000));
}
