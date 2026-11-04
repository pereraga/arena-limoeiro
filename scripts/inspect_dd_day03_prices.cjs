const fs = require('fs');

const content = fs.readFileSync('public/default-data.js', 'utf8');
const regex = /"date":\s*"2026-11-03"[\s\S]*?"total_price":\s*(\d+)/g;
let m;
while ((m = regex.exec(content)) !== null) {
  console.log('Match at', m.index, 'price:', m[1]);
  console.log(content.substring(m.index - 50, m.index + 200));
  console.log('---');
}
