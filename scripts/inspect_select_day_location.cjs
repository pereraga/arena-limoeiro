const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const idx = content.indexOf('window.selectMovementDay = function');
console.log('window.selectMovementDay at:', idx);
console.log(content.substring(idx - 100, idx + 1200));
