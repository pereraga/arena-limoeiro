const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const pos = html.indexOf('courtState');
console.log('first courtState pos:', pos);
console.log(html.substring(pos, pos + 2500));
