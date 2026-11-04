const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const idx = content.indexOf('function renderMovementMatches() {');
const nextFn = content.indexOf('window.filterMovementMatches = function', idx);
console.log('End of renderMovementMatches at:', nextFn);
console.log(content.substring(nextFn - 300, nextFn + 200));
