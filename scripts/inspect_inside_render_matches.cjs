const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const sIdx = content.indexOf('function renderMovementMatches() {');
const eIdx = content.indexOf('window.renderMovementMatches = renderMovementMatches;');

const chunk = content.substring(sIdx, eIdx);
console.log('--- Inside renderMovementMatches, all container uses ---');
let pos = 0;
while ((pos = chunk.indexOf('container.', pos)) !== -1) {
  console.log(chunk.substring(pos, pos + 200));
  pos += 'container.'.length;
}
