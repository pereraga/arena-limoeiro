const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '..', 'server.js');
const content = fs.readFileSync(serverPath, 'utf8');

const target = '/conectar-whatsapp';
const idx = content.indexOf(target);
console.log('Index of /conectar-whatsapp:', idx);
if (idx !== -1) {
  console.log(content.substring(idx - 100, idx + 800));
}
