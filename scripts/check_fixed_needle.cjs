const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const needle = 'Agendamentos / Fixos nesta Quadra:';
const idx = code.indexOf(needle);
console.log('Found Agendamentos / Fixos nesta Quadra at:', idx);
console.log(code.substring(idx - 100, idx + 800));
