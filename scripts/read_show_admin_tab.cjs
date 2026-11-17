const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find showAdminTab implementation and check 'reports'
const idx = html.indexOf("function showAdminTab");
console.log(html.substring(idx, idx + 1200));
