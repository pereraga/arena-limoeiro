const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const idx = content.indexOf('<!-- CALENDÁRIO HORIZONTAL DE DIAS -->');
console.log(content.substring(idx, idx + 1000));
