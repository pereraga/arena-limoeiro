const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const sIdx = content.indexOf('saveNovoClienteModal');
console.log('saveNovoClienteModal at:', sIdx);
if (sIdx !== -1) {
  console.log(content.substring(sIdx, sIdx + 1500));
}
