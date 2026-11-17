const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const idx = code.indexOf('renderMatchCardHtml(');
if (idx !== -1) {
  console.log(code.substring(idx - 50, idx + 2500));
} else {
  const idx2 = code.indexOf('function renderMatchCardHtml');
  console.log(code.substring(idx2, idx2 + 2500));
}
