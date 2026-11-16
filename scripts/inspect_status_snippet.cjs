const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const pos = 66272;
console.log('Snippet around 66272:');
console.log(html.substring(pos - 400, pos + 1500));
