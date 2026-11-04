const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const start = content.indexOf('const COURT_STORAGE_KEY');
console.log('COURT_STORAGE_KEY found at:', start);
if (start !== -1) {
  console.log(content.substring(start - 100, start + 1500));
}
