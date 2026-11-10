const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('=== Lines 4450 to 4550 ===');
for (let i = 4450; i < 4600; i++) {
  if (lines[i] && (lines[i].includes('modal') || lines[i].includes('Modal') || lines[i].includes('form') || lines[i].includes('onsubmit'))) {
    console.log(`Line ${i+1}: ${lines[i].trim().slice(0, 120)}`);
  }
}
