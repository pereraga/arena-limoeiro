const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const phrase = 'modalNovoCliente';
let pos = 0;
while ((pos = content.indexOf(phrase, pos)) !== -1) {
  console.log('modalNovoCliente at:', pos);
  console.log(content.substring(pos, pos + 300));
  pos += phrase.length;
}
