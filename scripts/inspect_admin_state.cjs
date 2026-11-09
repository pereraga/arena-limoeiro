const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- Checking default data and localStorage loading ---');
const idx = content.indexOf('window.adminGameState =');
if (idx !== -1) {
  console.log(content.substring(idx - 100, idx + 800));
}

// Where does adminGameState get initialized?
const idx2 = content.indexOf('adminGameState =');
console.log('adminGameState = at:', idx2);
