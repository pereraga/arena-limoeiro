const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

for (let i = 10075; i < 10105; i++) {
  console.log(`Line ${i+1}: ${lines[i]}`);
}
