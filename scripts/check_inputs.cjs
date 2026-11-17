const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const idx = code.indexOf('handleSaveDirectBooking =');
const fnCode = code.substring(idx, idx + 2500);

// Check if directBookingStart and directBookingEnd exist in HTML
console.log('directBookingStart in HTML:', code.includes('id="directBookingStart"'));
console.log('directBookingEnd in HTML:', code.includes('id="directBookingEnd"'));
console.log('directBookingPrice in HTML:', code.includes('id="directBookingPrice"'));
console.log('directBookingPayment in HTML:', code.includes('id="directBookingPayment"'));
console.log('directBookingCpf in HTML:', code.includes('id="directBookingCpf"'));
console.log('directBookingObs in HTML:', code.includes('id="directBookingObs"'));
