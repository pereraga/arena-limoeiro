const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let code = fs.readFileSync(path, 'utf8');

// 1. In handleSaveDirectBooking, make sure newBooking is also persisted to localStorage 'arena_bookings_backup'
// Let's inspect handleSaveDirectBooking
const idx = code.indexOf('window.handleSaveDirectBooking = async function');
console.log('handleSaveDirectBooking index:', idx);
