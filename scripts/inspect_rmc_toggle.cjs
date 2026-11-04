const fs = require('fs');

const content = fs.readFileSync('public/admin.html', 'utf8');
const idx = content.indexOf('onclick="toggleDetails(');
console.log(content.slice(idx - 200, idx + 800));
