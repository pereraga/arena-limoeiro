const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const pos = 208559;
console.log('Snippet around 208559:');
console.log(html.substring(pos - 600, pos + 2500));
