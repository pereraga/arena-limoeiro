const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const target = 'id="directBookingCourt"';
const pos = html.indexOf(target);
console.log('pos:', pos);
if (pos !== -1) {
  console.log(html.substring(pos, pos + 1000));
}
