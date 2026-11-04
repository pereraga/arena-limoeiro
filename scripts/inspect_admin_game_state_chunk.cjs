const fs = require('fs');

const content = fs.readFileSync('public/admin.html', 'utf8');

const idx = content.indexOf('window.adminGameState = {');
console.log(content.substring(idx - 200, idx + 400));
