const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find a booking object creation or rendering to see fields
const idx = html.indexOf('function renderMovementMatches');
console.log(html.substring(idx, idx + 1200));
