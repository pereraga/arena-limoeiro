const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const sIdx = content.indexOf('function getMatchesForDate(dateStr) {');
const chunk = content.substring(sIdx, sIdx + 4000);

console.log('isPastOrDay3 in getMatchesForDate:');
let pos = 0;
while ((pos = chunk.indexOf('isPastOrDay3', pos)) !== -1) {
  console.log(chunk.substring(Math.max(0, pos - 50), Math.min(chunk.length, pos + 80)));
  pos += 'isPastOrDay3'.length;
}
