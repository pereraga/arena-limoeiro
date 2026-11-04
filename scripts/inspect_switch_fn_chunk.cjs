const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const idxStart = content.indexOf('window.switchCadastrosSubTab = function(subtabName) {');
const idxEnd = content.indexOf('function renderCadastrosBookingsList() {');
console.log('idxStart:', idxStart, 'idxEnd:', idxEnd);
console.log(content.substring(idxStart, idxEnd));
