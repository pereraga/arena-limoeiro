const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const idx = content.indexOf('window.filterMovementMatches = function');
console.log(content.substring(idx - 250, idx));
