const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

console.log(content.slice(213500, 216500));
