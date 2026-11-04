const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const idx = content.indexOf('function getCourtById');
console.log('getCourtById at:', idx);
console.log(content.substring(idx, idx + 500));
