const fs = require('fs');

const content = fs.readFileSync('public/admin.html', 'utf8');

const idx = content.indexOf('function renderMatchCardHtml(');
console.log(content.slice(idx + 3500, idx + 5000));
