const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const pos1 = 258558;
console.log('--- HTML around 258558 ---');
console.log(html.substring(pos1 - 300, pos1 + 500));

const pos2 = 605591;
console.log('--- JS around 605591 ---');
console.log(html.substring(pos2, pos2 + 1500));
