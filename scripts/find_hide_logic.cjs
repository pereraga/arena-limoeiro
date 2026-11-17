const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find balcaoHideOccupiedToggle logic in renderBalcaoTimeSlots
const idx = html.indexOf('const shouldHideOccupied =');
console.log('shouldHideOccupied at', idx);
if (idx !== -1) {
  console.log(html.substring(idx - 100, idx + 400));
}
