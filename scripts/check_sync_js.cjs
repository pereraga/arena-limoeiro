const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/api/sync.js';
const code = fs.readFileSync(path, 'utf8');
console.log(code);
