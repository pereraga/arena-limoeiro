const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find renderBalcaoTimeSlots implementation
const idx = html.indexOf('function renderBalcaoTimeSlots');
console.log('renderBalcaoTimeSlots at', idx);
if (idx !== -1) {
  console.log(html.substring(idx, idx + 2500));
}
