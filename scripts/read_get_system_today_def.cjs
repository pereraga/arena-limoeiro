const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

for (let i = 45; i < 65; i++) {
  console.log(`Line ${i+1}: ${lines[i]}`);
}
for (let i = 5790; i < 5820; i++) {
  console.log(`Line ${i+1}: ${lines[i]}`);
}
