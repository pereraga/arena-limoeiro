const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const regex = /function getMatchesForDate[\s\S]*?\n  \}/g;
let m;
while ((m = regex.exec(code)) !== null) {
  console.log('Match index:', m.index, 'Length:', m[0].length);
  console.log('Snippet:\n', m[0].substring(0, 300));
}
