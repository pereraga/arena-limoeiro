const fs = require('fs');
const content = fs.readFileSync('public/default-data.js', 'utf8');

const idx = content.indexOf('initialMonthlyMembers: [');
console.log('initialMonthlyMembers found at:', idx);
if (idx !== -1) {
  console.log(content.substring(idx, idx + 1000));
}
