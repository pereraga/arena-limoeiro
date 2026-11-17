const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

const idx = 285296;
console.log(html.substring(idx + 3500, idx + 8000));
