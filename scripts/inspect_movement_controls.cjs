const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const pos = html.indexOf('id="movementStatusFilter"');
console.log('Snippet 1000 chars before and after:');
console.log(html.substring(pos - 600, pos + 1200));
