const fs = require('fs');

const content = fs.readFileSync('public/admin.html', 'utf8');

const idx = content.indexOf('window.getSystemToday = function');
console.log(content.substring(idx, idx + 400));
