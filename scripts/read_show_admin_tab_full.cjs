const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find showAdminTab definition again and list all lines
const idx = html.indexOf('function showAdminTab(targetTab)');
console.log(html.substring(idx, idx + 1000));
