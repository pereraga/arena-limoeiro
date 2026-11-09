const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const sIdx = content.indexOf('window.handleCadastrarNovoCliente =');
console.log(content.substring(sIdx + 3600, sIdx + 5200));
