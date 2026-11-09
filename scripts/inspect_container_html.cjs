const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- movementMatchesListContainer in renderMovementMatches ---');
const idx = content.indexOf('container.innerHTML =');
console.log('container.innerHTML = at:', idx);

let pos = idx;
for (let i = 0; i < 5; i++) {
  const nextPos = content.indexOf('container.innerHTML', pos + 1);
  if (nextPos === -1) break;
  console.log(`\nOccurrence ${i + 1} at ${nextPos}:`);
  console.log(content.substring(nextPos - 100, nextPos + 300));
  pos = nextPos;
}
