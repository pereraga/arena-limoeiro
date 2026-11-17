const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const needle = 'btnModalConfirmacaoConfirmar';
console.log('modalConfirmacao classes in HTML:');
const idx = code.indexOf(needle);
console.log(code.substring(idx - 400, idx + 400));
