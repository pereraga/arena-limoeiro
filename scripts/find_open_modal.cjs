const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const target = 'openDirectBookingModal';
let idx = 0;
while ((idx = html.indexOf(target, idx)) !== -1) {
    console.log('Found openDirectBookingModal at index:', idx);
    console.log(html.substring(idx - 30, idx + 100).replace(/\n/g, ' '));
    idx += target.length;
}
