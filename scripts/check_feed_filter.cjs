const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const idx = code.indexOf('renderMovementMatches');
const sub = code.substring(idx, idx + 4000);
const filterIdx = sub.indexOf('filteredMatches');
if (filterIdx !== -1) {
  console.log(sub.substring(filterIdx - 200, filterIdx + 1500));
} else {
  console.log('searching courtFilter in renderMovementMatches:');
  const cIdx = sub.indexOf('courtFilter');
  console.log(sub.substring(cIdx, cIdx + 1500));
}
