const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const sIdx = content.indexOf('renderMovementCalendarStrip');
console.log('first occurrence:', sIdx);
let pos = 0;
while ((pos = content.indexOf('renderMovementCalendarStrip', pos)) !== -1) {
  console.log('Occurrence at:', pos);
  console.log(content.substring(Math.max(0, pos - 50), Math.min(content.length, pos + 200)));
  pos += 'renderMovementCalendarStrip'.length;
}
