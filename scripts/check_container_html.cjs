const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const idx = code.indexOf('container.innerHTML =');
console.log('container.innerHTML:');
console.log(code.substring(idx - 100, idx + 2000));
