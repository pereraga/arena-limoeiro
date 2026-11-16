const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const target = 'autoCalculateDirectBookingPrice';
let idx = 0;
while ((idx = html.indexOf(target, idx)) !== -1) {
  console.log('Found autoCalculateDirectBookingPrice at:', idx);
  console.log(html.substring(idx - 20, idx + 200).replace(/\n/g, ' '));
  idx += target.length;
}

const targetCourts = 'ADMIN_COURTS';
idx = 0;
while ((idx = html.indexOf(targetCourts, idx)) !== -1) {
  console.log('Found ADMIN_COURTS at:', idx);
  console.log(html.substring(idx - 20, idx + 200).replace(/\n/g, ' '));
  idx += targetCourts.length;
}
