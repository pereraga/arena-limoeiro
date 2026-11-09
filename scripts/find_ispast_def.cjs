const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const sIdx = content.indexOf('function getMatchesForDate(dateStr) {');
const chunk = content.substring(sIdx, sIdx + 4000);

console.log('Defined variables in getMatchesForDate:');
console.log(chunk.substring(0, 800));
console.log('--- Search for isPastOrDay3 definition ---');
console.log('isPastOrDay3 defined in file? count =', [...content.matchAll(/isPastOrDay3/g)].length);

let pos = 0;
while ((pos = content.indexOf('isPastOrDay3', pos)) !== -1) {
  console.log('Found isPastOrDay3 at:', pos);
  console.log(content.substring(Math.max(0, pos - 80), Math.min(content.length, pos + 80)));
  pos += 'isPastOrDay3'.length;
}
