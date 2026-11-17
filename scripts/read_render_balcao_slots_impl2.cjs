const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

const idx = 622340;
console.log(html.substring(idx + 2500, idx + 5000));
