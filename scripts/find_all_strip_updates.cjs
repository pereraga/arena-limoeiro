const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

let p = 0;
while ((p = content.indexOf('updateMovementCalendarStrip', p)) !== -1) {
  console.log('occurrence at:', p);
  console.log(content.substring(Math.max(0, p - 80), Math.min(content.length, p + 120)));
  p += 'updateMovementCalendarStrip'.length;
}
