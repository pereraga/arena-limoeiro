const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const pos = html.indexOf('ARENA_CLOUD_DBS =');
console.log('ARENA_CLOUD_DBS pos:', pos);
console.log(html.substring(pos, pos + 800));
