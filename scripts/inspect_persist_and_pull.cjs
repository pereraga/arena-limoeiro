const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const pos = html.indexOf('function persistCourtState');
console.log('--- persistCourtState ---');
console.log(html.substring(pos, pos + 3000));

const posPull = html.indexOf('window.pullCourtsFromCloud =');
console.log('--- pullCourtsFromCloud ---');
console.log(html.substring(posPull, posPull + 3000));
