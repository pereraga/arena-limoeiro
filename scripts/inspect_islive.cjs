const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const target = 'function renderMatchCardHtml';
const idx = content.indexOf(target);
console.log(content.substring(idx, idx + 1000));
