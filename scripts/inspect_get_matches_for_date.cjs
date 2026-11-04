const fs = require('fs');

const content = fs.readFileSync('public/admin.html', 'utf8');

const idx = content.indexOf('function getMatchesForDate(');
console.log('Index of getMatchesForDate:', idx);
if (idx !== -1) {
  console.log(content.slice(idx, idx + 3500));
}
