const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const idx = code.indexOf('id="directBookingSummaryOccupied"');
console.log('directBookingSummaryOccupied:');
console.log(code.substring(idx - 100, idx + 800));

const fnIdx = code.indexOf('renderDirectBookingCourtOccupiedSummary');
console.log('renderDirectBookingCourtOccupiedSummary:');
console.log(code.substring(fnIdx - 50, fnIdx + 1200));
