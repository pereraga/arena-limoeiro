const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '..', 'server.js');
const content = fs.readFileSync(serverPath, 'utf8');

const target = '/api/whatsapp';
let idx = -1;
while ((idx = content.indexOf(target, idx + 1)) !== -1) {
  console.log('Match at', idx);
  console.log(content.substring(idx - 50, idx + 350));
  console.log('---');
}
