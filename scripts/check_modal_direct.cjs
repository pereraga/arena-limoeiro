const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const modalIdx = code.indexOf('id="directBookingModal"');
console.log(code.substring(modalIdx, modalIdx + 1200));

const formEnd = code.indexOf('</form>', modalIdx);
console.log(code.substring(formEnd - 600, formEnd + 200));
