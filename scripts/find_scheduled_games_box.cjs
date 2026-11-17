const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find balcaoScheduledGamesContainer and its styling/visibility
const idx = html.indexOf('id="balcaoScheduledGamesContainer"');
console.log('balcaoScheduledGamesContainer at', idx);
if (idx !== -1) {
  console.log(html.substring(idx - 100, idx + 600));
}
