const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const target = 'function renderMovementMatches()';
let pos = html.indexOf(target);
if (pos === -1) {
  pos = html.indexOf('renderMovementMatches = function');
}
console.log('Pos:', pos);
console.log(html.substring(pos, pos + 2500));
