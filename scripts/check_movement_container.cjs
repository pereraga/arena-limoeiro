const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const idx = code.indexOf('movementMatchesListContainer');
let pos = idx;
while ((pos = code.indexOf('movementMatchesListContainer', pos)) !== -1) {
  console.log('pos:', pos, code.substring(pos - 20, pos + 100));
  pos += 28;
}
