const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

console.log('balcaoHideOccupiedToggle matches:');
const m1 = html.match(/id=["']balcaoHideOccupiedToggle["'][^>]*>/g);
console.log(m1);

console.log('balcaoScheduledGamesList exists in HTML?', html.includes('id="balcaoScheduledGamesList"'));

const pos = html.indexOf('id="directBookingModal"');
console.log('directBookingModal pos:', pos);
if (pos !== -1) {
    console.log('Modal snippet:\n', html.substring(pos, pos + 2500));
}
