const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const idx = code.indexOf('selectMovementCourtPill =');
if (idx !== -1) {
  console.log(code.substring(idx - 50, idx + 1000));
} else {
  const idx2 = code.indexOf('selectMovementCourtPill');
  console.log('first occurrence of selectMovementCourtPill:', idx2);
  let p = idx2;
  while ((p = code.indexOf('selectMovementCourtPill', p)) !== -1) {
    console.log('pos:', p, code.substring(p - 30, p + 80));
    p += 25;
  }
}
