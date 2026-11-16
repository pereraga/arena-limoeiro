const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('Searching for getSystemToday...');
lines.forEach((l, i) => {
  if (l.includes('getSystemToday') && (l.includes('function') || l.includes('='))) {
    console.log(`Line ${i+1}: ${l.trim().slice(0, 120)}`);
  }
});
