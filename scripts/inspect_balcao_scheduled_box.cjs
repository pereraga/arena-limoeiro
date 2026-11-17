const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find balcaoScheduledGamesContainer and see what it displays
const idx = html.indexOf('id="balcaoScheduledGamesContainer"');
console.log(html.substring(idx - 50, idx + 600));
