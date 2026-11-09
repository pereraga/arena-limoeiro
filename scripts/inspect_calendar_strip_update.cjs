const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- Checking calendar strip update function ---');
const idx = content.indexOf('window.updateMovementCalendarStrip =');
console.log('updateMovementCalendarStrip at:', idx);
if (idx !== -1) {
  console.log(content.substring(idx, idx + 1000));
} else {
  // Let's search just updateMovementCalendarStrip
  let p = 0;
  while ((p = content.indexOf('updateMovementCalendarStrip', p)) !== -1) {
    console.log('occurrence at:', p);
    console.log(content.substring(Math.max(0, p - 50), Math.min(content.length, p + 150)));
    p += 'updateMovementCalendarStrip'.length;
  }
}
