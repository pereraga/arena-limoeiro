const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- Checking polling interval around 638000 ---');
const idx = content.indexOf('setInterval');
console.log('Total setInterval calls in file:');
let p = 0;
while ((p = content.indexOf('setInterval', p)) !== -1) {
  console.log('setInterval at:', p);
  console.log(content.substring(p, p + 250));
  p += 'setInterval'.length;
}
