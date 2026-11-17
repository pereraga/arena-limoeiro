const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find NOVA RESERVA BALCÃO or modalDirectBooking
const idx = html.indexOf('NOVA RESERVA BALCÃO');
console.log('NOVA RESERVA BALCÃO at', idx);
if (idx !== -1) {
  console.log(html.substring(idx - 300, idx + 2500));
}
