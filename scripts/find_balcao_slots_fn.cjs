const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find renderBalcaoTimeSlots as property or var
const m = [...html.matchAll(/renderBalcaoTimeSlots/g)];
console.log('Matches:', m.length);
m.forEach(match => {
  console.log('At index:', match.index);
  console.log(html.substring(Math.max(0, match.index - 50), Math.min(html.length, match.index + 200)));
});
