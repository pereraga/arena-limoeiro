const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

for (let i = 11860; i < 11930; i++) {
  if (lines[i].includes('monthly') || lines[i].includes('monthly_members') || lines[i].includes('isMensalista')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
  }
}
