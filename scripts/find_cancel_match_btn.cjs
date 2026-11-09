const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const phrase = 'Cancelar partida';
let pos = 0;
while ((pos = content.indexOf(phrase, pos)) !== -1) {
  console.log('Found "Cancelar partida" at:', pos);
  console.log(content.substring(Math.max(0, pos - 200), Math.min(content.length, pos + 300)));
  pos += phrase.length;
}

const phrase2 = 'cancelar partida';
pos = 0;
while ((pos = content.toLowerCase().indexOf(phrase2, pos)) !== -1) {
  console.log('Found "cancelar partida" (ci) at:', pos);
  console.log(content.substring(Math.max(0, pos - 150), Math.min(content.length, pos + 250)));
  pos += phrase2.length;
}
