const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

// Search for 'Sincronizando partidas em tempo real'
const phrase = 'Sincronizando partidas em tempo real';
let pos = 0;
while ((pos = content.indexOf(phrase, pos)) !== -1) {
  console.log('Found phrase at:', pos);
  console.log(content.substring(Math.max(0, pos - 200), Math.min(content.length, pos + 400)));
  pos += phrase.length;
}
