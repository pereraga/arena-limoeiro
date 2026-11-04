const fs = require('fs');

const content = fs.readFileSync('public/admin.html', 'utf8');

const idx = content.indexOf('function renderMovementMatches() {');
console.log(content.substring(idx, idx + 2500));
