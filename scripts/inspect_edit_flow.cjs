const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('Searching for Genilson...');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('genilson')) {
    console.log(`Line ${idx + 1}: ${line.trim().slice(0, 140)}`);
  }
});

console.log('\nSearching for edit modal and save functions...');
lines.forEach((line, idx) => {
  if (line.includes('function openEditGame') || line.includes('function saveEditGame') || line.includes('function openEditMonthly') || line.includes('function saveEditMonthly') || line.includes('function updateBooking') || line.includes('saveEditMatch')) {
    console.log(`Line ${idx + 1}: ${line.trim().slice(0, 140)}`);
  }
});
