const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- Checking auto-expire/start around 405000 ---');
const idx = content.indexOf('monthly-mensal-');
console.log('monthly-mensal- found at:', idx);
if (idx !== -1) {
  let p = 0;
  while ((p = content.indexOf('monthly-mensal-', p)) !== -1) {
    console.log('occurrence at:', p);
    console.log(content.substring(Math.max(0, p - 60), Math.min(content.length, p + 200)));
    p += 'monthly-mensal-'.length;
  }
}
