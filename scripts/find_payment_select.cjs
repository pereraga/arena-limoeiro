const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const target = 'Pagamento Pendente';
let idx = 0;
while ((idx = html.indexOf(target, idx)) !== -1) {
  console.log('Found Pagamento Pendente at:', idx);
  console.log(html.substring(Math.max(0, idx - 150), Math.min(html.length, idx + 250)).replace(/\n/g, ' '));
  idx += target.length;
}

const targetSelect = 'directBookingPayment';
idx = 0;
while ((idx = html.indexOf(targetSelect, idx)) !== -1) {
  console.log('Found directBookingPayment at:', idx);
  console.log(html.substring(Math.max(0, idx - 50), Math.min(html.length, idx + 350)).replace(/\n/g, ' '));
  idx += targetSelect.length;
}
