const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find all functions that populate or synchronize court dropdowns
console.log('--- syncMovementCourtPillsAndFilter ---');
const idx1 = html.indexOf('window.syncMovementCourtPillsAndFilter');
console.log(html.substring(idx1, idx1 + 1200));
