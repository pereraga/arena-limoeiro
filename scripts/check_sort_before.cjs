const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const idx = code.indexOf('matches.sort((a, b) => (a.start_time || \'\').localeCompare(b.start_time || \'\'));');
console.log(code.substring(idx - 1500, idx + 100));
