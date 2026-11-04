const fs = require('fs');

const content = fs.readFileSync('public/admin.html', 'utf8');

const idx = content.indexOf('function renderMovementMatches() {');
console.log(content.substring(idx + 2400, idx + 4500));
