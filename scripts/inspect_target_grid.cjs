const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const pos = html.indexOf('directBookingSlotsGrid');
console.log('pos of directBookingSlotsGrid:', pos);
console.log(html.substring(pos - 20, pos + 250));
