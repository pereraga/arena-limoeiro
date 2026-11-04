const fs = require('fs');
const content = fs.readFileSync('public/default-data.js', 'utf8');

const regex = /(initial[A-Za-z]+|monthly[A-Za-z]+)\s*[:=]/g;
let m;
while ((m = regex.exec(content)) !== null) {
  console.log(`Found: ${m[0]} at ${m.index}`);
}
console.log('window.ARENA_DEFAULT_DATA keys:');
const startIdx = content.indexOf('window.ARENA_DEFAULT_DATA');
if (startIdx !== -1) {
  console.log(content.substring(startIdx, startIdx + 500));
}
