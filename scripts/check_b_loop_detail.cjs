const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const needle = 'ARENA-B1950';
console.log('ARENA-B1950 in code?', code.includes(needle));

// Let's check getMatchesForDate lines around bookings loop
const idx = code.indexOf('function getMatchesForDate(dateStr)');
const bIdx = code.indexOf('(window.adminGameState.bookings || []).forEach(b => {', idx);
console.log(code.substring(bIdx, bIdx + 1200));
