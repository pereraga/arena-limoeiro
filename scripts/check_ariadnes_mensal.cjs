const fs = require('fs');
const content = fs.readFileSync('public/default-data.js', 'utf8');

// Check if mensal-1793115878805 is in initialMonthlyMembers
const idx = content.indexOf('mensal-1793115878805');
console.log('mensal-1793115878805 in default-data.js:', idx);
if (idx !== -1) {
  console.log(content.substring(idx - 50, idx + 400));
}
