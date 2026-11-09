const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- Checking BroadcastChannel handlers ---');
let p = 0;
while ((p = content.indexOf('BroadcastChannel', p)) !== -1) {
  console.log('occurrence at:', p);
  console.log(content.substring(Math.max(0, p - 60), Math.min(content.length, p + 250)));
  p += 'BroadcastChannel'.length;
}
