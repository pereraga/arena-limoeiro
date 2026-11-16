const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

const indices = [95482, 104231, 243249, 267694, 286991];
indices.forEach(idx => {
  console.log('=== Index:', idx, '===');
  console.log(html.substring(Math.max(0, idx - 150), Math.min(html.length, idx + 150)));
});
