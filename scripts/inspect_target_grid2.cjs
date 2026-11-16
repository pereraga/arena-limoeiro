const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const target = 'id="directBookingSlotsGrid"';
const pos = html.indexOf(target);
console.log('pos of id="directBookingSlotsGrid":', pos);
if (pos !== -1) {
    console.log(html.substring(pos - 40, pos + 250));
}
