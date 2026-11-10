const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

for (let i = 11130; i < 11155; i++) {
  console.log(`Line ${i+1}: ${lines[i]}`);
}
for (let i = 11520; i < 11545; i++) {
  console.log(`Line ${i+1}: ${lines[i]}`);
}
for (let i = 11995; i < 12015; i++) {
  console.log(`Line ${i+1}: ${lines[i]}`);
}
