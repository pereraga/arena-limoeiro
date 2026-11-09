const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const phrase = 'deleteMatchPrompt';
const idx = content.indexOf(phrase);
console.log('deleteMatchPrompt at:', idx);
if (idx !== -1) {
  console.log(content.substring(idx - 50, idx + 1800));
}
