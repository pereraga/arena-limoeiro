const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('=== ADMIN_COURTS declaration ===');
for (let i = 3480; i < 3520; i++) {
  if (lines[i].includes('ADMIN_COURTS') || lines[i].includes('courts') || lines[i].includes('fut5')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
  }
}

for (let i = 3850; i < 3880; i++) {
  if (lines[i].includes('ADMIN_COURTS') || lines[i].includes('courts') || lines[i].includes('fut5')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
  }
}

for (let i = 5740; i < 5770; i++) {
  if (lines[i].includes('ADMIN_COURTS') || lines[i].includes('courts') || lines[i].includes('fut5')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
  }
}
