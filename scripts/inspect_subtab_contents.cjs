const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const idx = content.indexOf('id="subtab-content-modalidades"');
console.log(content.substring(idx - 100, idx + 800));
