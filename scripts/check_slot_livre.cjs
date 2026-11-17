const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const needle = 'bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 border border-emerald-300';
const idx = code.indexOf(needle);
console.log('Slot livre classes before:');
console.log(code.substring(idx - 50, idx + 200));
