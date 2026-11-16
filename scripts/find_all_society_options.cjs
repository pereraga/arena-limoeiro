const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find all HTML options with society in public/admin.html
const regex = /<option[^>]*value=["']society["'][^>]*>([\s\S]*?)<\/option>/gi;
let m;
while ((m = regex.exec(html)) !== null) {
  console.log('--- At index:', m.index, 'Full match:');
  console.log(m[0]);
}
