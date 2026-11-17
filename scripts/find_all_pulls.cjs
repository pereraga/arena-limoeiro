const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find all calls to pullDataFromCloudDatabases
const regex = /pullDataFromCloudDatabases\(\)/g;
let m;
while ((m = regex.exec(html)) !== null) {
  console.log('Call at:', m.index);
  console.log(html.substring(Math.max(0, m.index - 50), Math.min(html.length, m.index + 200)));
}
