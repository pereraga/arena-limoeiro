const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('=== Lines 10700 to 10800 ===');
for (let i = 10600; i < 10800; i++) {
  if (lines[i] && (lines[i].includes('openEdit') || lines[i].includes('Editar') || lines[i].includes('renderCadastrosBookingsList'))) {
    console.log(`Line ${i+1}: ${lines[i].trim().slice(0, 120)}`);
  }
}
