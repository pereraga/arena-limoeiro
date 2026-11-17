const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find balcaoSlotSelectionSummary
const idx = html.indexOf('balcaoSlotSelectionSummary');
console.log('balcaoSlotSelectionSummary at', idx);
if (idx !== -1) {
  console.log(html.substring(idx - 100, idx + 600));
}
