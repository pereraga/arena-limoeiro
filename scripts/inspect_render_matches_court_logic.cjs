const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const pos = html.indexOf('const courtSelectEl = document.getElementById(\'movementCourtFilter\');');
console.log('Snippet around 503270:');
console.log(html.substring(pos, pos + 2500));
