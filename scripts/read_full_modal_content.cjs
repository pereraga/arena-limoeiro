const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

const startIdx = 285280;
const endIdx = html.indexOf('<!-- MODAIS OPERACIONAIS: EDIÇÃO', startIdx);
console.log('Modal length:', endIdx - startIdx);
console.log(html.substring(startIdx, endIdx));
