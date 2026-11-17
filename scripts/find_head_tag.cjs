const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find the <head> tag
const headEndIdx = html.indexOf('</head>');
console.log('headEndIdx:', headEndIdx);
console.log(html.substring(headEndIdx - 200, headEndIdx + 50));
