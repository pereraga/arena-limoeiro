const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const phrase = 'movementMatchesListContainer';
let pos = 0;
while ((pos = content.indexOf(phrase, pos)) !== -1) {
  console.log('Found occurrence at:', pos);
  console.log(content.substring(Math.max(0, pos - 150), Math.min(content.length, pos + 300)));
  pos += phrase.length;
}
