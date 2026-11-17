const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/default-data.js';
const code = fs.readFileSync(path, 'utf8');

const needle = 'ARENA-B1950';
console.log('ARENA-B1950 in default-data.js:', code.includes(needle));

// Search for 2026-11-17 bookings in default-data.js
const regex = /"date":\s*"2026-11-17"[\s\S]*?\}/g;
let m;
console.log('Bookings on 2026-11-17 in default-data.js:');
while ((m = regex.exec(code)) !== null) {
  console.log(m[0].substring(0, 200));
}
