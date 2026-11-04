const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const target = 'switchCadastrosSubTab';
let idx = -1;
while ((idx = content.indexOf(target, idx + 1)) !== -1) {
  console.log('Found at:', idx);
  console.log(content.substring(Math.max(0, idx - 40), Math.min(content.length, idx + 150)));
}
