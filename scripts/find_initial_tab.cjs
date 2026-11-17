const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find how initial tab is selected on window load
const idx = html.indexOf('const initialTab =');
console.log('initialTab at', idx);
if (idx !== -1) {
  console.log(html.substring(idx - 100, idx + 400));
}
