const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let code = fs.readFileSync(path, 'utf8');

// In applyNoShow:
// Instead of only deleting or sending tombstone, send action 'delete_booking' via fetch('/api/sync')
// And also in applyNoShow:
// Instead of only DELETE which might be blocked by RLS on Supabase if not configured,
// also do PATCH or upsert with status: 'cancelled', observation: 'Falta / Não compareceu - Cancelado'
// And immediately unshift into window.adminGameState.bookings as cancelled or filter it out

console.log('Checking applyNoShow...');
const idx = code.indexOf('window.applyNoShow = async function');
console.log('applyNoShow found at:', idx);

// In handleSaveDirectBooking:
// Ensure the new booking is stored immediately in localStorage and dual-synced
const idxSave = code.indexOf('window.handleSaveDirectBooking = async function');
console.log('handleSaveDirectBooking found at:', idxSave);
