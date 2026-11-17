const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Check btn-periodo-anual in the HTML
const idx = html.indexOf('id="btn-periodo-anual"');
console.log(html.substring(idx - 100, idx + 200));
