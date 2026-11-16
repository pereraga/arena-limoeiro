const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

for (let i = 11335; i < 11375; i++) {
  console.log(`Line ${i+1}: ${lines[i]}`);
}
for (let i = 11610; i < 11630; i++) {
  console.log(`Line ${i+1}: ${lines[i]}`);
}
