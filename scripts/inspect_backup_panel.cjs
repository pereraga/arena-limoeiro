const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const start = content.indexOf('id="panel-backup"');
console.log('panel-backup found at:', start);
if (start !== -1) {
  console.log(content.substring(start, start + 2500));
}
