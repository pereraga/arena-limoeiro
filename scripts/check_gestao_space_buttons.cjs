const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const needle = 'bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0';
console.log('Found badge # in admin.html:', code.includes(needle));
const idx = code.indexOf(needle);
console.log(code.substring(idx - 300, idx + 600));
