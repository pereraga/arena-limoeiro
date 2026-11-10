const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('SOCCER 6') || lines[i].includes('SOCCER 5') || lines[i].includes('fut6') || lines[i].includes('fut5')) {
    if (lines[i].toLowerCase().includes('court') || lines[i].toLowerCase().includes('quadra') || lines[i].toLowerCase().includes('modal')) {
      console.log(`Line ${i+1}: ${lines[i].trim().slice(0, 140)}`);
    }
  }
}
