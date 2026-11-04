const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

console.log(content.slice(205500, 209500));
