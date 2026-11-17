const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const idx = code.indexOf('id="directBookingCourt"');
console.log('directBookingCourt:');
console.log(code.substring(idx - 100, idx + 800));

const idxPills = code.indexOf('function renderMovementCourtPills');
console.log('renderMovementCourtPills:');
console.log(code.substring(idxPills, idxPills + 1200));
