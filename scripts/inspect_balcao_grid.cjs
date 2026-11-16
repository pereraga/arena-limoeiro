const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const pos = html.indexOf('id="directBookingModal"');
console.log('Snippet from modal pos to pos + 6000:');
console.log(html.substring(pos, pos + 4000));
