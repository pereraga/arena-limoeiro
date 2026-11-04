const fs = require('fs');
const content = fs.readFileSync('public/default-data.js', 'utf8');

console.log('default-data.js length:', content.length);
// Let's search for 2026-11-03
let idx = 0;
while ((idx = content.indexOf('2026-11-03', idx)) !== -1) {
  console.log('Match at char', idx, ':');
  console.log(content.substring(Math.max(0, idx - 80), Math.min(content.length, idx + 200)));
  console.log('---');
  idx += '2026-11-03'.length;
}

// Check monthly members for terça
const tIdx = content.indexOf('terca');
console.log('terca pos:', tIdx);
if (tIdx !== -1) {
  console.log(content.substring(tIdx - 100, tIdx + 400));
}
