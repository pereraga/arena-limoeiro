const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find window.reportsState
const idx = html.indexOf('window.reportsState = {');
console.log(html.substring(idx, idx + 500));
