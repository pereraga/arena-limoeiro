const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const target = 'getBalcaoOccupiedRanges =';
let idx = html.indexOf(target);
console.log('pos:', idx);
if (idx !== -1) {
    console.log(html.substring(idx, idx + 2500));
}
