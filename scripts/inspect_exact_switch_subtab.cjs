const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const idx = content.indexOf('window.switchCadastrosSubTab = function(subtabName) {');
console.log(content.substring(idx, idx + 1200));
