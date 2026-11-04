const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const idx = content.indexOf('<!-- 3. SUB-NAVEGAÇÃO COMPLETA DE CADASTROS');
console.log(content.substring(idx, idx + 2500));
