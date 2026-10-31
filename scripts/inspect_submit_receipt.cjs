const fs = require('fs');

const content = fs.readFileSync('public/index-sistema2.html', 'utf8');

const idx = content.lastIndexOf('const cleanPhone = phone.replace');
console.log(content.slice(idx, idx + 1800));
