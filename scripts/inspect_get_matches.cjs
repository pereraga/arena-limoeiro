const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find where getMatchesForDate is defined and inspect how properties of matches are shaped
const idx = html.indexOf('function getMatchesForDate');
console.log(html.substring(idx, idx + 2500));
