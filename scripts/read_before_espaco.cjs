const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

const startIdx = 66000;
console.log(html.substring(startIdx, startIdx + 1600));
