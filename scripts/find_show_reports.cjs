const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find showAdminTab('reports')
const idx = html.indexOf("targetTab === 'reports'");
console.log('targetTab === reports at', idx);
if (idx !== -1) {
  console.log(html.substring(idx - 50, idx + 200));
}
